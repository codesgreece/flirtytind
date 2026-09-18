import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { utcDayKey, haversineKm, ageFromBirthDate } from '../common/utils/geo';

@Injectable()
export class TopPicksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
  ) {}

  async list(userId: string) {
    await this.entitlements.assertTopPicks(userId);
    const periodKey = utcDayKey();

    let picks = await this.prisma.topPick.findMany({
      where: { ownerId: userId, periodKey },
      include: {
        target: {
          select: {
            id: true,
            profile: true,
            photos: { orderBy: { sortOrder: 'asc' }, take: 3 },
            interests: { include: { interest: true } },
          },
        },
      },
      orderBy: { score: 'desc' },
      take: 10,
    });

    if (picks.length === 0) {
      picks = await this.generate(userId, periodKey);
    }

    return picks.map((p) => ({
      id: p.id,
      score: p.score,
      periodKey: p.periodKey,
      user: {
        id: p.target.id,
        firstName: p.target.profile?.firstName ?? null,
        bio: p.target.profile?.bio ?? null,
        age: p.target.profile?.birthDate
          ? ageFromBirthDate(p.target.profile.birthDate)
          : null,
        photos: p.target.photos,
        interests: p.target.interests.map((i) => i.interest),
        verificationStatus: p.target.profile?.verificationStatus ?? null,
      },
    }));
  }

  private async generate(userId: string, periodKey: string) {
    const prefs = await this.prisma.preference.findUnique({ where: { userId } });
    const me = await this.prisma.profile.findUnique({ where: { userId } });
    const originLat = prefs?.passportLat ?? prefs?.latitude ?? me?.latitude;
    const originLng = prefs?.passportLng ?? prefs?.longitude ?? me?.longitude;

    const swiped = await this.prisma.swipe.findMany({
      where: { fromUserId: userId, undoneAt: null },
      select: { toUserId: true },
    });
    const exclude = new Set([userId, ...swiped.map((s) => s.toUserId)]);

    const candidates = await this.prisma.user.findMany({
      where: {
        id: { notIn: [...exclude] },
        status: 'ACTIVE',
        profile: { isDiscoverable: true },
        preferences: { incognito: false },
      },
      include: {
        profile: true,
        photos: { orderBy: { sortOrder: 'asc' }, take: 3 },
        interests: { include: { interest: true } },
      },
      take: 80,
    });

    const scored = candidates
      .filter((c) => c.profile && c.photos.length > 0)
      .map((c) => {
        let score = c.profile!.completionPercent;
        if (
          originLat != null &&
          originLng != null &&
          c.profile!.latitude != null &&
          c.profile!.longitude != null
        ) {
          const d = haversineKm(
            originLat,
            originLng,
            c.profile!.latitude,
            c.profile!.longitude,
          );
          score += Math.max(0, 100 - d);
        }
        if (c.profile!.verificationStatus === 'VERIFIED') score += 25;
        return { targetId: c.id, score, target: c };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const created = [];
    for (const s of scored) {
      const row = await this.prisma.topPick.upsert({
        where: {
          ownerId_targetId_periodKey: {
            ownerId: userId,
            targetId: s.targetId,
            periodKey,
          },
        },
        create: {
          ownerId: userId,
          targetId: s.targetId,
          score: s.score,
          periodKey,
        },
        update: { score: s.score },
        include: {
          target: {
            select: {
              id: true,
              profile: true,
              photos: { orderBy: { sortOrder: 'asc' }, take: 3 },
              interests: { include: { interest: true } },
            },
          },
        },
      });
      created.push(row);
    }
    return created;
  }
}
