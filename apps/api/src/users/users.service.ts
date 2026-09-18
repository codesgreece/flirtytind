import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        phoneCountry: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        lastSeenAt: true,
        createdAt: true,
        profile: true,
        preferences: true,
        entitlementWallet: true,
        subscription: { include: { plan: true } },
        photos: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!user || user.status === 'DELETED') {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async softDelete(userId: string) {
    await this.prisma.$transaction([
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          status: 'DELETED',
          deletedAt: new Date(),
          email: `deleted_${userId}@deleted.local`,
        },
      }),
      this.prisma.profile.updateMany({
        where: { userId },
        data: { isDiscoverable: false },
      }),
    ]);
    return { ok: true };
  }
}
