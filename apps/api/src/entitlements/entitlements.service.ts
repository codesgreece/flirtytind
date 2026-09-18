import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PLAN_ENTITLEMENTS,
  PlanCode,
  PlanEntitlements,
} from '@flirty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { utcDayKey, utcMonthKey, utcWeekKey } from '../common/utils/geo';

export type EntitlementStatus = PlanEntitlements & {
  planCode: PlanCode;
  wallet: {
    superLikeBalance: number;
    dmBalance: number;
    boostBalance: number;
    spotlightBalance: number;
  };
  usage: {
    likesToday: number;
    rewindsToday: number;
    superLikesThisWeek: number;
    dmsToday: number;
    boostsThisMonth: number;
  };
};

@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlanCode(userId: string): Promise<PlanCode> {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    if (
      sub &&
      sub.status === 'ACTIVE' &&
      sub.currentPeriodEnd > new Date()
    ) {
      return sub.plan.code as PlanCode;
    }
    return PlanCode.FREE;
  }

  async getStatus(userId: string): Promise<EntitlementStatus> {
    const planCode = await this.getPlanCode(userId);
    const entitlements = PLAN_ENTITLEMENTS[planCode];
    const wallet =
      (await this.prisma.entitlementWallet.findUnique({ where: { userId } })) ??
      (await this.prisma.entitlementWallet.create({
        data: { userId },
      }));

    const day = utcDayKey();
    const week = utcWeekKey();
    const month = utcMonthKey();

    const counters = await this.prisma.usageCounter.findMany({
      where: {
        userId,
        OR: [
          { key: 'likes', periodKey: day },
          { key: 'rewinds', periodKey: day },
          { key: 'super_likes', periodKey: week },
          { key: 'dms', periodKey: day },
          { key: 'boosts', periodKey: month },
        ],
      },
    });

    const countOf = (key: string, periodKey: string) =>
      counters.find((c) => c.key === key && c.periodKey === periodKey)?.count ?? 0;

    return {
      planCode,
      ...entitlements,
      wallet: {
        superLikeBalance: wallet.superLikeBalance,
        dmBalance: wallet.dmBalance,
        boostBalance: wallet.boostBalance,
        spotlightBalance: wallet.spotlightBalance,
      },
      usage: {
        likesToday: countOf('likes', day),
        rewindsToday: countOf('rewinds', day),
        superLikesThisWeek: countOf('super_likes', week),
        dmsToday: countOf('dms', day),
        boostsThisMonth: countOf('boosts', month),
      },
    };
  }

  async requireFeature(userId: string, feature: keyof PlanEntitlements): Promise<EntitlementStatus> {
    const status = await this.getStatus(userId);
    const value = status[feature];
    if (value === false || value === 0) {
      throw new ForbiddenException(`Plan entitlement missing: ${feature}`);
    }
    return status;
  }

  async assertCanLike(userId: string): Promise<void> {
    const status = await this.getStatus(userId);
    if (status.likesPerDay != null && status.usage.likesToday >= status.likesPerDay) {
      throw new ForbiddenException('Daily like limit reached');
    }
  }

  async assertCanRewind(userId: string): Promise<void> {
    const status = await this.getStatus(userId);
    if (status.rewindsPerDay != null && status.usage.rewindsToday >= status.rewindsPerDay) {
      throw new ForbiddenException('Daily rewind limit reached');
    }
  }

  async assertCanSuperLike(userId: string): Promise<{ useWallet: boolean }> {
    const status = await this.getStatus(userId);
    if (status.wallet.superLikeBalance > 0) {
      return { useWallet: true };
    }
    if (status.usage.superLikesThisWeek >= status.superLikesPerWeek) {
      throw new ForbiddenException('Weekly super like limit reached');
    }
    return { useWallet: false };
  }

  async assertCanDm(userId: string): Promise<{ useWallet: boolean }> {
    const status = await this.getStatus(userId);
    if (status.wallet.dmBalance > 0) {
      return { useWallet: true };
    }
    if (status.messageBeforeMatch || status.dmsPerDay === null) {
      if (status.dmsPerDay != null && status.usage.dmsToday >= status.dmsPerDay) {
        throw new ForbiddenException('Daily DM limit reached');
      }
      return { useWallet: false };
    }
    if (status.dmsPerDay != null && status.usage.dmsToday < status.dmsPerDay) {
      return { useWallet: false };
    }
    throw new ForbiddenException('Direct message entitlement required');
  }

  async assertCanBoost(userId: string): Promise<{ useWallet: boolean }> {
    const status = await this.getStatus(userId);
    if (status.wallet.boostBalance > 0) {
      return { useWallet: true };
    }
    if (status.boostsPerMonth > 0 && status.usage.boostsThisMonth < status.boostsPerMonth) {
      return { useWallet: false };
    }
    throw new ForbiddenException('Boost entitlement required');
  }

  async assertCanPassport(userId: string): Promise<void> {
    const status = await this.getStatus(userId);
    if (!status.passport) {
      throw new ForbiddenException('Passport requires Plus or higher');
    }
  }

  async assertCanIncognito(userId: string): Promise<void> {
    const status = await this.getStatus(userId);
    if (!status.incognito) {
      throw new ForbiddenException('Incognito requires Plus or higher');
    }
  }

  async assertSeeWhoLikesYou(userId: string): Promise<void> {
    const status = await this.getStatus(userId);
    if (!status.seeWhoLikesYou) {
      throw new ForbiddenException('See who likes you requires Gold or higher');
    }
  }

  async assertTopPicks(userId: string): Promise<void> {
    const status = await this.getStatus(userId);
    if (!status.topPicks) {
      throw new ForbiddenException('Top Picks requires Gold or higher');
    }
  }

  async incrementUsage(userId: string, key: string, periodKey: string, by = 1): Promise<number> {
    const row = await this.prisma.usageCounter.upsert({
      where: { userId_key_periodKey: { userId, key, periodKey } },
      create: { userId, key, periodKey, count: by },
      update: { count: { increment: by } },
    });
    return row.count;
  }

  async consumeWallet(
    userId: string,
    field: 'superLikeBalance' | 'dmBalance' | 'boostBalance' | 'spotlightBalance',
    amount = 1,
  ): Promise<void> {
    const wallet = await this.prisma.entitlementWallet.findUnique({ where: { userId } });
    if (!wallet || wallet[field] < amount) {
      throw new ForbiddenException(`Insufficient ${field}`);
    }
    await this.prisma.entitlementWallet.update({
      where: { userId },
      data: { [field]: { decrement: amount } },
    });
  }

  async creditWallet(
    userId: string,
    field: 'superLikeBalance' | 'dmBalance' | 'boostBalance' | 'spotlightBalance',
    amount: number,
  ): Promise<void> {
    await this.prisma.entitlementWallet.upsert({
      where: { userId },
      create: { userId, [field]: amount },
      update: { [field]: { increment: amount } },
    });
  }

  async recordLikeUsage(userId: string): Promise<void> {
    await this.incrementUsage(userId, 'likes', utcDayKey());
  }

  async recordRewindUsage(userId: string): Promise<void> {
    await this.incrementUsage(userId, 'rewinds', utcDayKey());
  }

  async recordSuperLikeUsage(userId: string, useWallet: boolean): Promise<void> {
    if (useWallet) {
      await this.consumeWallet(userId, 'superLikeBalance');
    } else {
      await this.incrementUsage(userId, 'super_likes', utcWeekKey());
    }
  }

  async recordDmUsage(userId: string, useWallet: boolean): Promise<void> {
    if (useWallet) {
      await this.consumeWallet(userId, 'dmBalance');
    } else {
      await this.incrementUsage(userId, 'dms', utcDayKey());
    }
  }

  async recordBoostUsage(userId: string, useWallet: boolean): Promise<void> {
    if (useWallet) {
      await this.consumeWallet(userId, 'boostBalance');
    } else {
      await this.incrementUsage(userId, 'boosts', utcMonthKey());
    }
  }

  async ensureWallet(userId: string) {
    const existing = await this.prisma.entitlementWallet.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.prisma.entitlementWallet.create({ data: { userId } });
  }

  async getOrThrowUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
