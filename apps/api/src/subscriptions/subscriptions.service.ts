import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PlanCode, PLAN_PRICES_EUR, PLAN_ENTITLEMENTS } from '@flirty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { RealtimeEmitter } from '../realtime/realtime.emitter';
import { REALTIME_EVENTS } from '@flirty/shared';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
    private readonly entitlements: EntitlementsService,
    private readonly realtime: RealtimeEmitter,
  ) {}

  async listPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      orderBy: { priceCents: 'asc' },
    });
    return plans.map((p) => ({
      ...p,
      entitlements: PLAN_ENTITLEMENTS[p.code as PlanCode],
      priceEur: PLAN_PRICES_EUR[p.code as PlanCode],
    }));
  }

  async subscribe(userId: string, planCode: PlanCode) {
    if (planCode === PlanCode.FREE) {
      throw new BadRequestException('Cannot subscribe to FREE via billing');
    }
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: planCode },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const bill = await this.billing.subscribe({
      userId,
      planCode,
      priceCents: plan.priceCents,
    });

    // Stripe (and similar): never activate from client confirmation alone
    if (!bill.confirmed) {
      return {
        pending: true,
        provider: bill.provider,
        providerRef: bill.providerRef,
        checkoutUrl: bill.checkoutUrl ?? null,
      };
    }

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    const sub = await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        provider: bill.provider,
        providerRef: bill.providerRef,
      },
      update: {
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        provider: bill.provider,
        providerRef: bill.providerRef,
      },
      include: { plan: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'subscription.subscribe',
        meta: { planCode, providerRef: bill.providerRef },
      },
    });

    this.realtime.emitToUser(userId, REALTIME_EVENTS.SUBSCRIPTION_UPDATED, {
      planCode,
      status: sub.status,
    });

    return sub;
  }

  async mySubscription(userId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    const status = await this.entitlements.getStatus(userId);
    return { subscription: sub, entitlements: status };
  }

  async cancel(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) throw new NotFoundException('No subscription');

    if (sub.providerRef) {
      await this.billing.cancelSubscription({
        userId,
        providerRef: sub.providerRef,
      });
    }

    return this.prisma.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: true },
      include: { plan: true },
    });
  }

  async restore(userId: string) {
    const result = await this.billing.restorePurchases({ userId });
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    return { ...result, subscription: sub };
  }
}
