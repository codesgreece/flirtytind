import { StripeBillingProvider } from './stripe-billing.provider';

describe('Stripe billing webhook idempotency', () => {
  it('skips reprocessing when BillingEvent already exists', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      id: 'be1',
      eventId: 'evt_dup',
      type: 'checkout.session.completed',
    });
    const create = jest.fn();
    const prisma = {
      billingEvent: { findUnique, create },
      subscription: { upsert: jest.fn() },
      auditLog: { create: jest.fn() },
      consumableLedger: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
      entitlementWallet: { upsert: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      subscriptionPlan: { findUnique: jest.fn() },
    };

    const config = {
      get: (key: string) => {
        const map: Record<string, string> = {
          BILLING_PROVIDER: 'stripe',
          STRIPE_SECRET_KEY: 'sk_test_x',
          STRIPE_WEBHOOK_SECRET: 'whsec_test',
        };
        return map[key];
      },
      getOrThrow: (key: string) => {
        const v = config.get(key);
        if (!v) throw new Error(key);
        return v;
      },
    };

    const provider = new StripeBillingProvider(config as never, prisma as never);

    // Bypass Stripe SDK signature verification by stubbing stripe instance
    const fakeEvent = {
      id: 'evt_dup',
      type: 'checkout.session.completed',
      data: { object: {} },
    };
    (provider as unknown as { stripe: object }).stripe = {
      webhooks: {
        constructEvent: () => fakeEvent,
      },
    };

    const first = await provider.handleWebhook({
      rawBody: Buffer.from('{}'),
      signature: 'sig',
    });
    expect(first.handled).toBe(true);
    expect(first.eventId).toBe('evt_dup');
    expect(create).not.toHaveBeenCalled();

    // Second call with same event id also short-circuits
    const second = await provider.handleWebhook({
      rawBody: Buffer.from('{}'),
      signature: 'sig',
    });
    expect(second.handled).toBe(true);
    expect(create).not.toHaveBeenCalled();
  });

  it('stores BillingEvent then processes new events once', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    const create = jest.fn().mockResolvedValue({});
    const upsert = jest.fn().mockResolvedValue({});
    const planFind = jest.fn().mockResolvedValue({ id: 'plan1', code: 'PLUS' });
    const auditCreate = jest.fn().mockResolvedValue({});

    const prisma = {
      billingEvent: { findUnique, create },
      subscription: { upsert, findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      auditLog: { create: auditCreate },
      consumableLedger: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
      entitlementWallet: { upsert: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      subscriptionPlan: { findUnique: planFind },
    };

    const config = {
      get: (key: string) => {
        const map: Record<string, string> = {
          BILLING_PROVIDER: 'stripe',
          STRIPE_SECRET_KEY: 'sk_test_x',
          STRIPE_WEBHOOK_SECRET: 'whsec_test',
          APP_URL: 'http://localhost:3001',
        };
        return map[key];
      },
      getOrThrow: (key: string) => config.get(key)!,
    };

    const provider = new StripeBillingProvider(config as never, prisma as never);
    const session = {
      id: 'cs_1',
      metadata: { userId: 'u1', planCode: 'PLUS', kind: 'subscription' },
      client_reference_id: 'u1',
      subscription: 'sub_1',
    };
    (provider as unknown as { stripe: object }).stripe = {
      webhooks: {
        constructEvent: () => ({
          id: 'evt_new',
          type: 'checkout.session.completed',
          data: { object: session },
        }),
      },
    };

    const result = await provider.handleWebhook({
      rawBody: Buffer.from('{}'),
      signature: 'sig',
    });

    expect(result).toEqual({
      handled: true,
      eventId: 'evt_new',
      type: 'checkout.session.completed',
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          provider: 'stripe',
          eventId: 'evt_new',
          type: 'checkout.session.completed',
        }),
      }),
    );
    expect(upsert).toHaveBeenCalled();
  });
});
