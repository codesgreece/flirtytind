import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileInput } from '@flirty/validation';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            photos: { orderBy: { sortOrder: 'asc' } },
            interests: { include: { interest: true } },
          },
        },
      },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return {
      ...profile,
      photos: profile.user.photos,
      interests: profile.user.interests.map((i) => i.interest),
      user: undefined,
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const { interestIds, birthDate, ...rest } = input;

    await this.prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        ...rest,
        birthDate: birthDate ? new Date(birthDate) : undefined,
      },
      update: {
        ...rest,
        ...(birthDate !== undefined ? { birthDate: new Date(birthDate) } : {}),
      },
    });

    if (interestIds) {
      await this.prisma.profileInterest.deleteMany({ where: { userId } });
      if (interestIds.length > 0) {
        await this.prisma.profileInterest.createMany({
          data: interestIds.map((interestId) => ({ userId, interestId })),
          skipDuplicates: true,
        });
      }
    }

    const completionPercent = await this.recomputeCompletion(userId);
    await this.prisma.profile.update({
      where: { userId },
      data: { completionPercent },
    });

    return this.getMyProfile(userId);
  }

  async listInterests() {
    return this.prisma.interest.findMany({ orderBy: { name: 'asc' } });
  }

  async getPublicProfile(viewerId: string, targetUserId: string) {
    const blocked = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: viewerId, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: viewerId },
        ],
      },
    });
    if (blocked) throw new NotFoundException('Profile not found');

    const profile = await this.prisma.profile.findUnique({
      where: { userId: targetUserId },
      include: {
        user: {
          select: {
            status: true,
            photos: { orderBy: { sortOrder: 'asc' } },
            interests: { include: { interest: true } },
          },
        },
      },
    });
    if (!profile || profile.user.status !== 'ACTIVE') {
      throw new NotFoundException('Profile not found');
    }

    return {
      ...profile,
      userId: targetUserId,
      photos: profile.user.photos,
      interests: profile.user.interests.map((i) => i.interest),
      user: undefined,
    };
  }

  async recomputeCompletion(userId: string): Promise<number> {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) return 0;
    const [photoCount, interestCount] = await Promise.all([
      this.prisma.profilePhoto.count({ where: { userId } }),
      this.prisma.profileInterest.count({ where: { userId } }),
    ]);

    const checks = [
      !!profile.firstName,
      !!profile.birthDate,
      !!profile.gender,
      !!profile.bio && profile.bio.length >= 20,
      !!profile.lookingFor,
      !!profile.city,
      photoCount >= 1,
      photoCount >= 3,
      interestCount >= 3,
      !!profile.heightCm,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }
}
