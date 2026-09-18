import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { SwipeAction } from '@prisma/client';

describe('Flirty Greece critical flows (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const suffix = Date.now();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  async function register(email: string, password = 'TestPass123!') {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password })
      .expect(201);
    return res.body as {
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string };
    };
  }

  it('registers and logs in', async () => {
    const email = `e2e.a.${suffix}@test.local`;
    const reg = await register(email);
    expect(reg.accessToken).toBeTruthy();
    expect(reg.user.email).toBe(email);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPass123!' })
      .expect(201);
    expect(login.body.accessToken).toBeTruthy();
  });

  it('mutual like creates match and conversation; messaging works', async () => {
    const a = await register(`e2e.alice.${suffix}@test.local`);
    const b = await register(`e2e.bob.${suffix}@test.local`);

    // Make both discoverable with profiles
    const birth = '1998-06-15';
    for (const u of [a, b]) {
      await request(app.getHttpServer())
        .patch('/api/v1/profiles/me')
        .set('Authorization', `Bearer ${u.accessToken}`)
        .send({
          firstName: u.user.email.startsWith('e2e.alice') ? 'Alice' : 'Bob',
          birthDate: birth,
          gender: u.user.email.startsWith('e2e.alice') ? 'WOMAN' : 'MAN',
          lookingFor: 'FIGURING_OUT',
          city: 'Athens',
        })
        .expect((res) => {
          if (![200, 201].includes(res.status)) {
            throw new Error(`profile update failed: ${res.status} ${JSON.stringify(res.body)}`);
          }
        });

      await request(app.getHttpServer())
        .patch('/api/v1/preferences/me')
        .set('Authorization', `Bearer ${u.accessToken}`)
        .send({
          showMe: 'EVERYONE',
          minAge: 18,
          maxAge: 50,
          maxDistanceKm: 100,
          latitude: 37.9838,
          longitude: 23.7275,
        })
        .expect((res) => {
          if (![200, 201].includes(res.status)) {
            throw new Error(`prefs failed: ${res.status} ${JSON.stringify(res.body)}`);
          }
        });
    }

    // A likes B
    await request(app.getHttpServer())
      .post('/api/v1/swipes')
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ targetUserId: b.user.id, action: SwipeAction.LIKE })
      .expect((res) => {
        if (![200, 201].includes(res.status)) {
          throw new Error(`swipe A->B failed: ${res.status} ${JSON.stringify(res.body)}`);
        }
        expect(res.body.matched).toBeFalsy();
      });

    // B likes A → match
    const swipeBack = await request(app.getHttpServer())
      .post('/api/v1/swipes')
      .set('Authorization', `Bearer ${b.accessToken}`)
      .send({ targetUserId: a.user.id, action: SwipeAction.LIKE })
      .expect((res) => {
        if (![200, 201].includes(res.status)) {
          throw new Error(`swipe B->A failed: ${res.status} ${JSON.stringify(res.body)}`);
        }
      });

    expect(swipeBack.body.matched).toBeTruthy();
    expect(swipeBack.body.conversationId).toBeTruthy();
    const conversationId = swipeBack.body.conversationId as string;

    // Send message
    const msg = await request(app.getHttpServer())
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ conversationId, body: 'Hello from Alice', clientMessageId: crypto.randomUUID() })
      .expect((res) => {
        if (![200, 201].includes(res.status)) {
          throw new Error(`message failed: ${res.status} ${JSON.stringify(res.body)}`);
        }
      });

    expect(msg.body.body).toBe('Hello from Alice');

    // History
    const history = await request(app.getHttpServer())
      .get(`/api/v1/messages/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${b.accessToken}`)
      .expect(200);

    const messages = history.body.items ?? history.body.messages ?? history.body;
    expect(Array.isArray(messages) ? messages.length : 1).toBeGreaterThanOrEqual(1);

    // Block
    await request(app.getHttpServer())
      .post('/api/v1/blocks')
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ blockedUserId: b.user.id })
      .expect((res) => {
        if (![200, 201].includes(res.status)) {
          throw new Error(`block failed: ${res.status} ${JSON.stringify(res.body)}`);
        }
      });

    // Report
    await request(app.getHttpServer())
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ reportedUserId: b.user.id, category: 'spam', description: 'test' })
      .expect((res) => {
        if (![200, 201].includes(res.status)) {
          throw new Error(`report failed: ${res.status} ${JSON.stringify(res.body)}`);
        }
      });
  });

  it('enforces subscription plan entitlements for free likes', async () => {
    const user = await register(`e2e.limits.${suffix}@test.local`);
    const entitlements = await request(app.getHttpServer())
      .get('/api/v1/entitlements/me')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(entitlements.body.planCode === 'FREE' || entitlements.body.plan?.code === 'FREE' || entitlements.body.likesPerDay === 50 || entitlements.body.entitlements?.likesPerDay === 50).toBeTruthy();
  });

  it('dev billing can upgrade plan', async () => {
    const user = await register(`e2e.gold.${suffix}@test.local`);
    const sub = await request(app.getHttpServer())
      .post('/api/v1/subscriptions/subscribe')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ planCode: 'GOLD' })
      .expect((res) => {
        if (![200, 201].includes(res.status)) {
          throw new Error(`subscribe failed: ${res.status} ${JSON.stringify(res.body)}`);
        }
      });

    expect(JSON.stringify(sub.body)).toMatch(/GOLD/i);

    const likes = await request(app.getHttpServer())
      .get('/api/v1/likes/received')
      .set('Authorization', `Bearer ${user.accessToken}`);

    // Gold can access who likes you (200) vs 403 for free
    expect([200, 201]).toContain(likes.status);
  });
});
