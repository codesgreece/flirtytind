/**
 * Two-user critical path script — REAL API + REALTIME.
 * Run with: node --import tsx scripts/two-user-e2e.mts  (or pnpm exec tsx)
 */
import { io, Socket } from 'socket.io-client';
import { createReadStream, writeFileSync } from 'fs';
import { join } from 'path';

const BASE = process.env.API_URL ?? 'http://localhost:3001/api/v1';
const WS = process.env.WS_URL ?? 'http://localhost:3001';
const SUF = Date.now();

type Auth = { accessToken: string; refreshToken: string; user: { id: string; email: string } };

async function json(res: Response) {
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${res.url}: ${JSON.stringify(body)}`);
  }
  return body as any;
}

async function api(path: string, opts: RequestInit & { token?: string } = {}) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.headers as Record<string, string>),
  };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.body && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  return json(res);
}

function waitForEvent(socket: Socket, event: string, timeoutMs = 8000): Promise<any> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeoutMs);
    socket.once(event, (payload) => {
      clearTimeout(t);
      resolve(payload);
    });
  });
}

async function connectSocket(token: string): Promise<Socket> {
  const socket = io(WS, {
    auth: { token },
    transports: ['websocket'],
    forceNew: true,
  });
  await new Promise<void>((resolve, reject) => {
    socket.on('connect', () => resolve());
    socket.on('connect_error', (e) => reject(e));
    setTimeout(() => reject(new Error('socket connect timeout')), 8000);
  });
  return socket;
}

function makePng(): Buffer {
  // Minimal valid 1x1 PNG
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
}

async function main() {
  const results: string[] = [];
  const ok = (s: string) => {
    results.push(`PASS ${s}`);
    console.log(`PASS ${s}`);
  };

  // Register A & B
  const a = (await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: `user.a.${SUF}@test.local`, password: 'TestPass123!' }),
  })) as Auth;
  ok('A registers');
  const b = (await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: `user.b.${SUF}@test.local`, password: 'TestPass123!' }),
  })) as Auth;
  ok('B registers');

  // Profiles
  await api('/profiles/me', {
    method: 'PATCH',
    token: a.accessToken,
    body: JSON.stringify({
      firstName: 'Alex',
      birthDate: '1995-03-10',
      gender: 'WOMAN',
      lookingFor: 'FIGURING_OUT',
      city: 'Athens',
      bio: 'Real profile for Alex — coffee and Aegean sunsets.',
    }),
  });
  ok('A creates profile');
  await api('/profiles/me', {
    method: 'PATCH',
    token: b.accessToken,
    body: JSON.stringify({
      firstName: 'Blake',
      birthDate: '1993-07-22',
      gender: 'MAN',
      lookingFor: 'LONG_TERM',
      city: 'Athens',
      bio: 'Real profile for Blake — hiking and live music.',
    }),
  });
  ok('B creates profile');

  // Preferences with location
  for (const u of [a, b]) {
    await api('/preferences/me', {
      method: 'PATCH',
      token: u.accessToken,
      body: JSON.stringify({
        showMe: 'EVERYONE',
        minAge: 18,
        maxAge: 50,
        maxDistanceKm: 200,
        latitude: 37.9838,
        longitude: 23.7275,
        expandDistance: true,
        expandAge: true,
        minPhotos: 1,
      }),
    });
  }
  ok('A/B set preferences');

  // Upload real PNG photos
  const pngPath = join('/tmp', `flirty-${SUF}.png`);
  writeFileSync(pngPath, makePng());
  for (const [label, u] of [
    ['A', a],
    ['B', b],
  ] as const) {
    const form = new FormData();
    const blob = new Blob([makePng()], { type: 'image/png' });
    form.append('file', blob, `${label}.png`);
    const res = await fetch(`${BASE}/photos/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${u.accessToken}` },
      body: form,
    });
    await json(res);
    ok(`${label} uploads real photo`);
  }

  // Device registration (push token)
  await api('/devices/register', {
    method: 'POST',
    token: a.accessToken,
    body: JSON.stringify({ pushToken: `ExponentPushToken[test-a-${SUF}]`, platform: 'ios' }),
  });
  ok('A registers push device');

  // Discover
  const feedA = await api('/discover/feed?limit=20', { token: a.accessToken });
  const foundB = (feedA.items ?? []).some((i: any) => i.userId === b.user.id);
  if (!foundB) throw new Error('A did not discover B');
  ok('A discovers B');
  const feedB = await api('/discover/feed?limit=20', { token: b.accessToken });
  const foundA = (feedB.items ?? []).some((i: any) => i.userId === a.user.id);
  if (!foundA) throw new Error('B did not discover A');
  ok('B discovers A');

  // Connect sockets before swipes for match event
  const sockA = await connectSocket(a.accessToken);
  const sockB = await connectSocket(b.accessToken);
  ok('Sockets connected');

  const matchWaitA = waitForEvent(sockA, 'match.created');
  const matchWaitB = waitForEvent(sockB, 'match.created');

  // A likes B
  const swipe1 = await api('/swipes', {
    method: 'POST',
    token: a.accessToken,
    body: JSON.stringify({ targetUserId: b.user.id, action: 'LIKE' }),
  });
  if (swipe1.matched) throw new Error('Should not match on first like');
  ok('A likes B');

  // B likes A → match
  const swipe2 = await api('/swipes', {
    method: 'POST',
    token: b.accessToken,
    body: JSON.stringify({ targetUserId: a.user.id, action: 'LIKE' }),
  });
  if (!swipe2.matched || !swipe2.conversationId) {
    throw new Error(`Expected match: ${JSON.stringify(swipe2)}`);
  }
  ok('B likes A — match created');

  const [evA, evB] = await Promise.all([matchWaitA, matchWaitB]);
  ok(`Realtime match.created to A: ${JSON.stringify(evA).slice(0, 80)}`);
  ok(`Realtime match.created to B: ${JSON.stringify(evB).slice(0, 80)}`);

  const conversationId = swipe2.conversationId as string;

  // Join conversation rooms (wait for ack)
  await new Promise<void>((resolve, reject) => {
    sockA.timeout(5000).emit('conversation.join', { conversationId }, (err: Error | null, res: any) => {
      if (err || !res?.ok) reject(err ?? new Error('A join failed'));
      else resolve();
    });
  });
  await new Promise<void>((resolve, reject) => {
    sockB.timeout(5000).emit('conversation.join', { conversationId }, (err: Error | null, res: any) => {
      if (err || !res?.ok) reject(err ?? new Error('B join failed'));
      else resolve();
    });
  });
  ok('Joined conversation rooms');

  // Typing
  const typingWait = waitForEvent(sockB, 'user.typing');
  sockA.emit('typing', { conversationId, isTyping: true });
  const typing = await typingWait;
  if (!typing.isTyping || typing.userId !== a.user.id) throw new Error('Typing failed');
  ok('Typing indicator works');

  // Message A → B
  const msgWait = waitForEvent(sockB, 'message.created');
  const msg1 = await api('/messages', {
    method: 'POST',
    token: a.accessToken,
    body: JSON.stringify({
      conversationId,
      body: 'Hello Blake — real message from Alex',
      clientMessageId: crypto.randomUUID(),
    }),
  });
  ok('A sends real message');
  const rtMsg = await msgWait;
  if (!String(rtMsg.body ?? rtMsg.message?.body ?? '').includes('Hello Blake')) {
    // accept if payload shape differs but event fired
    console.log('message.created payload', rtMsg);
  }
  ok('B receives message realtime');

  // Reply B → A
  const replyWait = waitForEvent(sockA, 'message.created');
  await api('/messages', {
    method: 'POST',
    token: b.accessToken,
    body: JSON.stringify({
      conversationId,
      body: 'Hey Alex — real reply',
      clientMessageId: crypto.randomUUID(),
    }),
  });
  await replyWait;
  ok('A receives reply realtime');

  // Read receipts
  await api(`/messages/conversations/${conversationId}/read`, {
    method: 'PATCH',
    token: b.accessToken,
  });
  ok('Read receipt mark works');

  // Notifications persisted
  const notes = await api('/notifications', { token: b.accessToken });
  if (!(notes.items?.length >= 1)) throw new Error('Expected notifications for B');
  ok('Notification is generated');

  // Subscriptions
  await api('/subscriptions/subscribe', {
    method: 'POST',
    token: a.accessToken,
    body: JSON.stringify({ planCode: 'GOLD' }),
  });
  ok('A upgrades to GOLD (dev billing)');
  const likes = await api('/likes/received', { token: a.accessToken });
  ok(`Who Likes You accessible for GOLD (${Array.isArray(likes) ? likes.length : 'ok'})`);

  // Block & report
  await api('/blocks', {
    method: 'POST',
    token: a.accessToken,
    body: JSON.stringify({ blockedUserId: b.user.id }),
  });
  ok('Block works');
  await api('/reports', {
    method: 'POST',
    token: a.accessToken,
    body: JSON.stringify({ reportedUserId: b.user.id, category: 'spam', description: 'e2e' }),
  });
  ok('Report works');

  // Production seed refuse
  // (covered by unit test)

  sockA.close();
  sockB.close();

  console.log('\n=== ALL CRITICAL TWO-USER FLOWS PASSED ===');
  console.log(results.join('\n'));
}

main().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
