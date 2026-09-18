import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PlanCode, ConsumableType } from '@flirty/shared';
import {
  BillingProvider,
  BillingResult,
  SubscriptionStatusResult,
  WebhookHandleResult,
} from './billing.provider';

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

  async cancelSubscription(_params: {
    userId: string;
    providerRef: string;
  }): Promise<{ ok: boolean }> {
    return { ok: true };
  }

  async restorePurchases(_params: { userId: string }): Promise<{ restored: number }> {
    return { restored: 0 };
  }

  async getSubscriptionStatus(_params: {
    providerRef: string;
  }): Promise<SubscriptionStatusResult | null> {
    return { status: 'ACTIVE' };
  }

  async handleWebhook(_params: {
    rawBody: Buffer | string;
    signature?: string;
    headers?: Record<string, string | string[] | undefined>;
  }): Promise<WebhookHandleResult> {
    return { handled: false, eventId: 'dev', type: 'dev.noop' };
  }
}
