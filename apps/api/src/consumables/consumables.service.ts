import { BadRequestException, Injectable } from '@nestjs/common';
import { ConsumableType, CONSUMABLE_PRICES_EUR } from '@flirty/shared';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { BoostsService } from '../boosts/boosts.service';

@Injectable()
export class ConsumablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
    private readonly entitlements: EntitlementsService,
    private readonly boosts: BoostsService,
  ) {}

  async purchase(userId: string, type: ConsumableType, idempotencyKey?: string) {
    const key = idempotencyKey ?? randomUUID();
    const existing = await this.prisma.consumableLedger.findUnique({
      where: { idempotencyKey: key },
    });
    if (existing) {
      return { ledger: existing, reused: true };
    }

    const priceEur = CONSUMABLE_PRICES_EUR[type];
    const priceCents = Math.round(priceEur * 100);

    const bill = await this.billing.purchaseConsumable({
      userId,
      type,
      priceCents,
    });
    if (!bill.confirmed) {
      return {
        pending: true,
        provider: bill.provider,
        providerRef: bill.providerRef,
        checkoutUrl: bill.checkoutUrl ?? null,
      };
    }

    const quantity = quantityFor(type);
    const ledger = await this.prisma.consumableLedger.create({
      data: {
        userId,
        type,
        quantity,
        priceCents,
        providerRef: bill.providerRef,
        idempotencyKey: key,
      },
    });

    // Credit wallet
    switch (type) {
      case ConsumableType.SUPER_LIKES_5:
        await this.entitlements.creditWallet(userId, 'superLikeBalance', quantity);
        break;
      case ConsumableType.BOOST_30:
        await this.entitlements.creditWallet(userId, 'boostBalance', quantity);
        break;
      case ConsumableType.FIRST_MESSAGE:
        await this.entitlements.creditWallet(userId, 'dmBalance', quantity);
        break;
      case ConsumableType.SPOTLIGHT_30:
        await this.entitlements.creditWallet(userId, 'spotlightBalance', quantity);
        break;
    }

    return { ledger, reused: false };
  }

  async activateBoost(userId: string) {
    return this.boosts.activate(userId);
  }

  async activateSpotlight(userId: string) {
    const check = await this.entitlements.getStatus(userId);
    if (check.wallet.spotlightBalance <= 0) {
      throw new BadRequestException('No spotlight balance');
    }
    await this.entitlements.consumeWallet(userId, 'spotlightBalance');
    const endsAt = new Date(Date.now() + 30 * 60 * 1000);
    // deactivate existing
    await this.prisma.spotlight.updateMany({
      where: { userId, active: true },
      data: { active: false },
    });
    return this.prisma.spotlight.create({
      data: { userId, endsAt, active: true },
    });
  }
}

function quantityFor(type: ConsumableType): number {
  switch (type) {
    case ConsumableType.SUPER_LIKES_5:
      return 5;
    case ConsumableType.BOOST_30:
    case ConsumableType.SPOTLIGHT_30:
    case ConsumableType.FIRST_MESSAGE:
      return 1;
    default:
      return 1;
  }
}
