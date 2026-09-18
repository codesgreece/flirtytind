import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlanCode, ConsumableType } from '@flirty/shared';
import {
  BillingProvider,
  BillingResult,
  SubscriptionStatusResult,
  WebhookHandleResult,
} from './billing.provider';
import { DevBillingProvider } from './dev-billing.provider';
import { StripeBillingProvider } from './stripe-billing.provider';

@Injectable()
export class BillingService implements BillingProvider {
  private readonly provider: BillingProvider;

  constructor(
    private readonly dev: DevBillingProvider,
    private readonly stripe: StripeBillingProvider,
    config: ConfigService,
  ) {
    const name = (config.get<string>('BILLING_PROVIDER', 'dev') ?? 'dev').toLowerCase();
    const stripeKey = config.get<string>('STRIPE_SECRET_KEY');
    this.provider = name === 'stripe' && stripeKey ? this.stripe : this.dev;
  }

  subscribe(params: {
    userId: string;
    planCode: PlanCode;
    priceCents: number;
  }): Promise<BillingResult> {
    return this.provider.subscribe(params);
  }

  purchaseConsumable(params: {
    userId: string;
    type: ConsumableType;
    priceCents: number;
  }): Promise<BillingResult> {
    return this.provider.purchaseConsumable(params);
  }

  cancelSubscription(params: {
    userId: string;
    providerRef: string;
  }): Promise<{ ok: boolean }> {
    return this.provider.cancelSubscription(params);
  }

  restorePurchases(params: { userId: string }): Promise<{ restored: number }> {
    return this.provider.restorePurchases(params);
  }

  getSubscriptionStatus(params: {
    providerRef: string;
  }): Promise<SubscriptionStatusResult | null> {
    return this.provider.getSubscriptionStatus(params);
  }

  handleWebhook(params: {
    rawBody: Buffer | string;
    signature?: string;
    headers?: Record<string, string | string[] | undefined>;
  }): Promise<WebhookHandleResult> {
    return this.provider.handleWebhook(params);
  }
}
