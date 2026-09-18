import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../entitlements/entitlements.service';

@Injectable()
export class LikesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
  ) {}

  async whoLikesYou(userId: string) {
    await this.entitlements.assertSeeWhoLikesYou(userId);

    // Likes received where we haven't matched and haven't liked back
    const likes = await this.prisma.like.findMany({
      where: {
        toUserId: userId,
        fromUser: { status: 'ACTIVE' },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: {
          select: {
            id: true,
            profile: true,
            photos: { orderBy: { sortOrder: 'asc' }, take: 1 },
          },
        },
      },
    });

    const myLikes = await this.prisma.like.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true },
    });
    const likedBack = new Set(myLikes.map((l) => l.toUserId));

    return likes
      .filter((l) => !likedBack.has(l.fromUserId))
      .map((l) => ({
        id: l.id,
        isSuper: l.isSuper,
        createdAt: l.createdAt,
        user: {
          id: l.fromUser.id,
          firstName: l.fromUser.profile?.firstName ?? null,
          photo: l.fromUser.photos[0] ?? null,
          bio: l.fromUser.profile?.bio ?? null,
          verificationStatus: l.fromUser.profile?.verificationStatus ?? null,
        },
      }));
  }
}
