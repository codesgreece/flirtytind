import { Injectable } from '@nestjs/common';
import { Gender, ShowMe } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ageFromBirthDate, haversineKm } from '../common/utils/geo';

export type DiscoverQuery = {
  cursor?: string;
  limit?: number;
};

@Injectable()
export class DiscoverService {
  constructor(private readonly prisma: PrismaService) {}

  async feed(userId: string, query: DiscoverQuery) {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
    const prefs = await this.prisma.preference.findUnique({ where: { userId } });
    const myProfile = await this.prisma.profile.findUnique({ where: { userId } });

    const originLat =
      prefs?.passportLat ?? prefs?.latitude ?? myProfile?.latitude ?? null;
    const originLng =
      prefs?.passportLng ?? prefs?.longitude ?? myProfile?.longitude ?? null;
    const maxKm = prefs?.maxDistanceKm ?? 50;
    const minAge = prefs?.minAge ?? 18;
    const maxAge = prefs?.maxAge ?? 35;
    const showMe = prefs?.showMe ?? ShowMe.EVERYONE;
    const expandDistance = prefs?.expandDistance ?? true;
    const expandAge = prefs?.expandAge ?? true;
    const minPhotos = prefs?.minPhotos ?? 1;
    const requireBio = prefs?.requireBio ?? false;

    const now = new Date();

    // Exclude: self, blocked either way, already swiped (not undone), matched, deleted/suspended
    const [blocks, swipes, matches] = await Promise.all([
      this.prisma.block.findMany({
        where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
        select: { blockerId: true, blockedId: true },
      }),
      this.prisma.swipe.findMany({
        where: { fromUserId: userId, undoneAt: null },
        select: { toUserId: true },
      }),
      this.prisma.match.findMany({
        where: {
          unmatchedAt: null,
          OR: [{ userAId: userId }, { userBId: userId }],
        },
        select: { userAId: true, userBId: true },
      }),
    ]);

    const exclude = new Set<string>([userId]);
    for (const b of blocks) {
      exclude.add(b.blockerId);
      exclude.add(b.blockedId);
    }
    for (const s of swipes) exclude.add(s.toUserId);
    for (const m of matches) {
      exclude.add(m.userAId);
      exclude.add(m.userBId);
    }

    const genders = gendersForShowMe(showMe);

    const candidates = await this.prisma.user.findMany({
      where: {
        id: { notIn: [...exclude] },
        status: 'ACTIVE',
        profile: {
          isDiscoverable: true,
          ...(genders ? { gender: { in: genders } } : {}),
          ...(requireBio ? { bio: { not: null } } : {}),
        },
        // Hide others who are in incognito (they shouldn't appear in discovery)
        preferences: { incognito: false },
      },
      include: {
        profile: true,
        photos: { orderBy: { sortOrder: 'asc' }, take: 6 },
        interests: { include: { interest: true } },
        preferences: true,
        boosts: {
          where: { active: true, endsAt: { gt: now } },
          take: 1,
        },
      },
      take: 400,
    });

    type Ranked = {
      userId: string;
      distanceKm: number | null;
      age: number | null;
      boosted: boolean;
      score: number;
      profile: (typeof candidates)[0]['profile'];
      photos: (typeof candidates)[0]['photos'];
      interests: { id: string; name: string; category: string | null }[];
      firstName: string | null;
      verificationStatus: string | null;
    };

    const ranked: Ranked[] = [];

    for (const c of candidates) {
      if (!c.profile) continue;
      if (c.photos.length < minPhotos) continue;
      // Skip if their preferences say incognito (extra safety)
      if (c.preferences?.incognito) continue;

      const age = c.profile.birthDate
        ? ageFromBirthDate(c.profile.birthDate, now)
        : null;
      if (age != null) {
        const inAge = age >= minAge && age <= maxAge;
        if (!inAge && !expandAge) continue;
        if (!inAge && expandAge && (age < minAge - 5 || age > maxAge + 5)) continue;
      }

      let distanceKm: number | null = null;
      if (
        originLat != null &&
        originLng != null &&
        c.profile.latitude != null &&
        c.profile.longitude != null
      ) {
        distanceKm = haversineKm(
          originLat,
          originLng,
          c.profile.latitude,
          c.profile.longitude,
        );
        const inDist = distanceKm <= maxKm;
        if (!inDist && !expandDistance) continue;
        if (!inDist && expandDistance && distanceKm > maxKm * 2) continue;
      }

      const boosted = c.boosts.length > 0;
      let score = 0;
      if (boosted) score += 1000;
      if (distanceKm != null) score += Math.max(0, 200 - distanceKm);
      if (age != null && age >= minAge && age <= maxAge) score += 50;
      score += Math.min(c.profile.completionPercent, 100) * 0.5;
      score += c.photos.length * 5;

      ranked.push({
        userId: c.id,
        distanceKm: distanceKm != null ? Math.round(distanceKm * 10) / 10 : null,
        age,
        boosted,
        score,
        profile: c.profile,
        photos: c.photos,
        interests: c.interests.map((i) => i.interest),
        firstName: c.profile.firstName,
        verificationStatus: c.profile.verificationStatus,
      });
    }

    ranked.sort((a, b) => b.score - a.score);

    // Cursor = offset index encoded as string number
    const offset = query.cursor ? Number(query.cursor) || 0 : 0;
    const page = ranked.slice(offset, offset + limit);
    const nextOffset = offset + page.length;
    const nextCursor = nextOffset < ranked.length ? String(nextOffset) : null;

    return {
      items: page.map(({ score: _s, ...rest }) => rest),
      nextCursor,
      totalApprox: ranked.length,
    };
  }
}

function gendersForShowMe(showMe: ShowMe): Gender[] | null {
  switch (showMe) {
    case ShowMe.WOMEN:
      return [Gender.WOMAN];
    case ShowMe.MEN:
      return [Gender.MAN];
    case ShowMe.EVERYONE:
    default:
      return null;
  }
}
