import { PlanCode, ConsumableType } from '@flirty/shared';

export type BillingResult = {
  provider: string;
  providerRef: string;
  confirmed: boolean;
  checkoutUrl?: string | null;
};

export type SubscriptionStatusResult = {
  status: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: Date | null;
};

export type WebhookHandleResult = {
  handled: boolean;
  eventId: string;
  type: string;
};

export interface BillingProvider {
  subscribe(params: {
    userId: string;
    planCode: PlanCode;
    priceCents: number;
  }): Promise<BillingResult>;

  purchaseConsumable(params: {
    userId: string;
    type: ConsumableType;
    priceCents: number;
  }): Promise<BillingResult>;

  cancelSubscription(params: {
    userId: string;
    providerRef: string;
  }): Promise<{ ok: boolean }>;

  restorePurchases(params: {
    userId: string;
  }): Promise<{ restored: number }>;

  getSubscriptionStatus(params: {
    providerRef: string;
  }): Promise<SubscriptionStatusResult | null>;

  handleWebhook(params: {
    rawBody: Buffer | string;
    signature?: string;
    headers?: Record<string, string | string[] | undefined>;
  }): Promise<WebhookHandleResult>;
}
