import { Injectable } from '@nestjs/common';
import { PlanCode, ConsumableType } from '@flirty/shared';
import { BillingProvider, BillingResult } from './billing.provider';
import { DevBillingProvider } from './dev-billing.provider';

@Injectable()
export class BillingService implements BillingProvider {
  constructor(private readonly dev: DevBillingProvider) {}

  subscribe(params: {
    userId: string;
    planCode: PlanCode;
    priceCents: number;
  }): Promise<BillingResult> {
    return this.dev.subscribe(params);
  }

  purchaseConsumable(params: {
    userId: string;
    type: ConsumableType;
    priceCents: number;
  }): Promise<BillingResult> {
    return this.dev.purchaseConsumable(params);
  }
}
