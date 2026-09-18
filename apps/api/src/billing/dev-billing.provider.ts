import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PlanCode, ConsumableType } from '@flirty/shared';
import { BillingProvider, BillingResult } from './billing.provider';

@Injectable()
export class DevBillingProvider implements BillingProvider {
  async subscribe(params: {
    userId: string;
    planCode: PlanCode;
    priceCents: number;
  }): Promise<BillingResult> {
    return {
      provider: 'dev',
      providerRef: `dev_sub_${params.planCode}_${params.userId.slice(0, 8)}_${randomUUID().slice(0, 8)}`,
      confirmed: true,
    };
  }

  async purchaseConsumable(params: {
    userId: string;
    type: ConsumableType;
    priceCents: number;
  }): Promise<BillingResult> {
    return {
      provider: 'dev',
      providerRef: `dev_cons_${params.type}_${params.userId.slice(0, 8)}_${randomUUID().slice(0, 8)}`,
      confirmed: true,
    };
  }
}
