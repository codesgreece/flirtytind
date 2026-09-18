import { PlanCode, ConsumableType } from '@flirty/shared';

export type BillingResult = {
  provider: string;
  providerRef: string;
  confirmed: boolean;
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
}
