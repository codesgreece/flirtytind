import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { RealtimeEmitter } from '../realtime/realtime.emitter';
import { REALTIME_EVENTS } from '@flirty/shared';
import { utcDayKey } from '../common/utils/geo';

export const flirtSchema = z.object({
  targetUserId: z.string().uuid(),
  message: z.string().max(280).optional(),
});

@Injectable()
export class FlirtsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly realtime: RealtimeEmitter,
  ) {}

  async send(userId: string, input: z.infer<typeof flirtSchema>) {
    if (userId === input.targetUserId) {
      throw new BadRequestException('Cannot flirt with yourself');
    }
    const target = await this.prisma.user.findFirst({
      where: { id: input.targetUserId, status: 'ACTIVE' },
    });
    if (!target) throw new NotFoundException('User not found');

    const status = await this.entitlements.getStatus(userId);
    if (!status.flirtsUnlimited) {
      const day = utcDayKey();
      const count = await this.prisma.usageCounter.findUnique({
        where: {
          userId_key_periodKey: { userId, key: 'flirts', periodKey: day },
        },
      });
      if ((count?.count ?? 0) >= 5) {
        throw new ForbiddenException('Daily flirt limit reached');
      }
      await this.entitlements.incrementUsage(userId, 'flirts', day);
    }

    const flirt = await this.prisma.flirt.create({
      data: {
        fromUserId: userId,
        toUserId: input.targetUserId,
        message: input.message,
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: input.targetUserId,
        type: 'FLIRT',
        title: 'Someone flirted with you',
        body: input.message?.slice(0, 120) ?? 'You received a flirt',
        data: { fromUserId: userId, flirtId: flirt.id },
      },
    });

    this.realtime.emitToUser(input.targetUserId, REALTIME_EVENTS.NOTIFICATION_CREATED, {
      type: 'FLIRT',
      flirtId: flirt.id,
    });

    return flirt;
  }

  async received(userId: string) {
    return this.prisma.flirt.findMany({
      where: { toUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        fromUser: {
          select: {
            id: true,
            profile: { select: { firstName: true } },
            photos: { orderBy: { sortOrder: 'asc' }, take: 1 },
          },
        },
      },
    });
  }
}
