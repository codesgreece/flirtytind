import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.block.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            id: true,
            profile: { select: { firstName: true } },
            photos: { orderBy: { sortOrder: 'asc' }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async block(userId: string, blockedUserId: string) {
    if (userId === blockedUserId) {
      throw new BadRequestException('Cannot block yourself');
    }
    return this.prisma.block.upsert({
      where: {
        blockerId_blockedId: { blockerId: userId, blockedId: blockedUserId },
      },
      create: { blockerId: userId, blockedId: blockedUserId },
      update: {},
    });
  }

  async unblock(userId: string, blockedUserId: string) {
    await this.prisma.block.deleteMany({
      where: { blockerId: userId, blockedId: blockedUserId },
    });
    return { ok: true };
  }
}
