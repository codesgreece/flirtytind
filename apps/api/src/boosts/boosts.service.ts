import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { RealtimeEmitter } from '../realtime/realtime.emitter';
import { REALTIME_EVENTS } from '@flirty/shared';

@Injectable()
export class BoostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly realtime: RealtimeEmitter,
  ) {}

  async status(userId: string) {
    const now = new Date();
    const active = await this.prisma.boost.findFirst({
      where: { userId, active: true, endsAt: { gt: now } },
      orderBy: { endsAt: 'desc' },
    });
    return { active: !!active, boost: active };
  }

  async activate(userId: string) {
    const check = await this.entitlements.assertCanBoost(userId);
    await this.entitlements.recordBoostUsage(userId, check.useWallet);

    await this.prisma.boost.updateMany({
      where: { userId, active: true },
      data: { active: false },
    });

    const endsAt = new Date(Date.now() + 30 * 60 * 1000);
    const boost = await this.prisma.boost.create({
      data: { userId, endsAt, active: true },
    });

    this.realtime.emitToUser(userId, REALTIME_EVENTS.BOOST_STARTED, {
      boostId: boost.id,
      endsAt,
    });

    return boost;
  }
}
