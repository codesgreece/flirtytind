import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlanCode, ConsumableType } from '@flirty/shared';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import {
  BillingProvider,
  BillingResult,
  SubscriptionStatusResult,
  WebhookHandleResult,
} from './billing.provider';

@Injectable()
export class StripeBillingProvider implements BillingProvider, OnModuleInit {
  private readonly logger = new Logger(StripeBillingProvider.name);
  private stripe: Stripe | null = null;
  private readonly enabled: boolean;
  private readonly webhookSecret?: string;
  private readonly priceMap: Record<string, string | undefined>;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const provider = (config.get<string>('BILLING_PROVIDER', 'dev') ?? 'dev').toLowerCase();
    const secretKey = config.get<string>('STRIPE_SECRET_KEY');
    this.enabled = provider === 'stripe' && !!secretKey;
    this.webhookSecret = config.get<string>('STRIPE_WEBHOOK_SECRET') || undefined;
    this.priceMap = {
      [PlanCode.PLUS]: config.get<string>('STRIPE_PRICE_PLUS'),
      [PlanCode.GOLD]: config.get<string>('STRIPE_PRICE_GOLD'),
      [PlanCode.PLATINUM]: config.get<string>('STRIPE_PRICE_PLATINUM'),
      [ConsumableType.SUPER_LIKES_5]: config.get<string>('STRIPE_PRICE_SUPERLIKES5'),
      [ConsumableType.BOOST_30]: config.get<string>('STRIPE_PRICE_BOOST'),
      [ConsumableType.FIRST_MESSAGE]: config.get<string>('STRIPE_PRICE_FIRST_MESSAGE'),
      [ConsumableType.SPOTLIGHT_30]: config.get<string>('STRIPE_PRICE_SPOTLIGHT'),
    };

    if (this.enabled && secretKey) {
      this.stripe = new Stripe(secretKey);
    }
  }

  onModuleInit() {
    if (
      (this.config.get<string>('BILLING_PROVIDER', 'dev') ?? 'dev').toLowerCase() === 'stripe' &&
      !this.stripe
    ) {
      this.logger.warn('BILLING_PROVIDER=stripe but STRIPE_SECRET_KEY is missing');
    }
  }

  private requireStripe(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException('Stripe billing is not configured');
    }
    return this.stripe;
  }

  async subscribe(params: {
    userId: string;
    planCode: PlanCode;
    priceCents: number;
  }): Promise<BillingResult> {
    const stripe = this.requireStripe();
    const priceId = this.priceMap[params.planCode];
    if (!priceId) {
      throw new BadRequestException(`No Stripe price configured for plan ${params.planCode}`);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.appUrl()}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.appUrl()}/billing/cancel`,
      client_reference_id: params.userId,
      metadata: {
        userId: params.userId,
        planCode: params.planCode,
        kind: 'subscription',
      },
      subscription_data: {
        metadata: {
          userId: params.userId,
          planCode: params.planCode,
        },
      },
    });

    // Never confirm from client — webhook activates the subscription
    return {
      provider: 'stripe',
      providerRef: session.id,
      confirmed: false,
      checkoutUrl: session.url,
    };
  }

  async purchaseConsumable(params: {
    userId: string;
    type: ConsumableType;
    priceCents: number;
  }): Promise<BillingResult> {
    const stripe = this.requireStripe();
    const priceId = this.priceMap[params.type];
    if (!priceId) {
      throw new BadRequestException(`No Stripe price configured for ${params.type}`);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.appUrl()}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.appUrl()}/billing/cancel`,
      client_reference_id: params.userId,
      metadata: {
        userId: params.userId,
        consumableType: params.type,
        kind: 'consumable',
        priceCents: String(params.priceCents),
      },
    });

    return {
      provider: 'stripe',
      providerRef: session.id,
      confirmed: false,
      checkoutUrl: session.url,
    };
  }

  async cancelSubscription(params: {
    userId: string;
    providerRef: string;
  }): Promise<{ ok: boolean }> {
    const stripe = this.requireStripe();
    const subId = await this.resolveStripeSubscriptionId(params.providerRef);
    if (!subId) {
      throw new BadRequestException('Unable to resolve Stripe subscription');
    }
    await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
    await this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: 'billing.cancel_subscription',
        meta: { providerRef: params.providerRef, stripeSubscriptionId: subId },
      },
    });
    return { ok: true };
  }

  async restorePurchases(params: { userId: string }): Promise<{ restored: number }> {
    const stripe = this.requireStripe();
    const sub = await this.prisma.subscription.findUnique({
      where: { userId: params.userId },
      include: { plan: true },
    });
    if (!sub?.providerRef || sub.provider !== 'stripe') {
      return { restored: 0 };
    }

    const stripeSubId = await this.resolveStripeSubscriptionId(sub.providerRef);
    if (!stripeSubId) return { restored: 0 };

    const remote = await stripe.subscriptions.retrieve(stripeSubId);
    if (remote.status === 'active' || remote.status === 'trialing') {
      await this.prisma.subscription.update({
        where: { userId: params.userId },
        data: {
          status: 'ACTIVE',
          currentPeriodEnd: periodEndFromSubscription(remote),
          cancelAtPeriodEnd: remote.cancel_at_period_end,
          providerRef: stripeSubId,
        },
      });
      return { restored: 1 };
    }
    return { restored: 0 };
  }

  async getSubscriptionStatus(params: {
    providerRef: string;
  }): Promise<SubscriptionStatusResult | null> {
    const stripe = this.requireStripe();
    const subId = await this.resolveStripeSubscriptionId(params.providerRef);
    if (!subId) return null;
    const remote = await stripe.subscriptions.retrieve(subId);
    return {
      status: remote.status.toUpperCase(),
      cancelAtPeriodEnd: remote.cancel_at_period_end,
      currentPeriodEnd: periodEndFromSubscription(remote),
    };
  }

  async handleWebhook(params: {
    rawBody: Buffer | string;
    signature?: string;
    headers?: Record<string, string | string[] | undefined>;
  }): Promise<WebhookHandleResult> {
    const stripe = this.requireStripe();
    if (!this.webhookSecret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET is not configured');
    }

    const signature =
      params.signature ||
      headerValue(params.headers, 'stripe-signature') ||
      '';

    let event: Stripe.Event;
    try {
      const body =
        typeof params.rawBody === 'string'
          ? params.rawBody
          : params.rawBody.toString('utf8');
      event = stripe.webhooks.constructEvent(body, signature, this.webhookSecret);
    } catch (e) {
      this.logger.warn(`Stripe webhook signature failed: ${(e as Error).message}`);
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    // Idempotency via BillingEvent
    const existing = await this.prisma.billingEvent.findUnique({
      where: { eventId: event.id },
    });
    if (existing) {
      return { handled: true, eventId: event.id, type: event.type };
    }

    await this.prisma.billingEvent.create({
      data: {
        provider: 'stripe',
        eventId: event.id,
        type: event.type,
        payload: event as unknown as object,
        processedAt: new Date(),
      },
    });

    try {
      await this.dispatchEvent(event);
    } catch (e) {
      this.logger.error(`Failed processing Stripe event ${event.id}: ${(e as Error).message}`);
      // Event is stored; leave for ops to replay manually if needed
      throw e;
    }

    return { handled: true, eventId: event.id, type: event.type };
  }

  private async dispatchEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'invoice.paid':
        await this.onInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.deleted':
        await this.onSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'charge.refunded':
        await this.onChargeRefunded(event.data.object as Stripe.Charge);
        break;
      default:
        this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }
  }

  private async onCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId || session.client_reference_id;
    if (!userId) return;

    const kind = session.metadata?.kind;
    if (kind === 'consumable') {
      await this.fulfillConsumable(userId, session);
      return;
    }

    const planCode = session.metadata?.planCode as PlanCode | undefined;
    if (!planCode || planCode === PlanCode.FREE) return;

    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { code: planCode } });
    if (!plan) return;

    const stripeSubId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    const periodEnd = daysFromNow(30);

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        provider: 'stripe',
        providerRef: stripeSubId ?? session.id,
      },
      update: {
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        provider: 'stripe',
        providerRef: stripeSubId ?? session.id,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'billing.subscription_activated',
        meta: { planCode, sessionId: session.id, providerRef: stripeSubId },
      },
    });
  }

  private async onInvoicePaid(invoice: Stripe.Invoice) {
    const stripeSubId = subscriptionIdFromInvoice(invoice);
    if (!stripeSubId) return;

    const sub = await this.prisma.subscription.findFirst({
      where: { providerRef: stripeSubId, provider: 'stripe' },
    });
    if (!sub) return;

    const linePeriodEnd = invoice.lines?.data?.[0]?.period?.end;
    const periodEnd = linePeriodEnd
      ? new Date(linePeriodEnd * 1000)
      : daysFromNow(30);

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: 'ACTIVE',
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
    });
  }

  private async onSubscriptionDeleted(remote: Stripe.Subscription) {
    const userId = remote.metadata?.userId;
    const sub = userId
      ? await this.prisma.subscription.findUnique({ where: { userId } })
      : await this.prisma.subscription.findFirst({
          where: { providerRef: remote.id, provider: 'stripe' },
        });
    if (!sub) return;

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'EXPIRED', cancelAtPeriodEnd: false },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: sub.userId,
        action: 'billing.subscription_expired',
        meta: { stripeSubscriptionId: remote.id },
      },
    });
  }

  private async onChargeRefunded(charge: Stripe.Charge) {
    await this.prisma.auditLog.create({
      data: {
        userId: null,
        action: 'billing.charge_refunded',
        meta: {
          chargeId: charge.id,
          amount: charge.amount_refunded,
          paymentIntent: charge.payment_intent,
          metadata: charge.metadata,
        },
      },
    });

    // Best-effort: if metadata identifies a consumable ledger entry, revoke wallet credit
    const userId = charge.metadata?.userId;
    const consumableType = charge.metadata?.consumableType as ConsumableType | undefined;
    if (!userId || !consumableType) return;

    const ledger = await this.prisma.consumableLedger.findFirst({
      where: { userId, type: consumableType },
      orderBy: { createdAt: 'desc' },
    });
    if (!ledger) return;

    const field = walletFieldFor(consumableType);
    if (!field) return;

    const wallet = await this.prisma.entitlementWallet.findUnique({ where: { userId } });
    if (!wallet) return;

    const next = Math.max(0, (wallet[field] as number) - ledger.quantity);
    await this.prisma.entitlementWallet.update({
      where: { userId },
      data: { [field]: next },
    });
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'billing.consumable_revoked',
        meta: { consumableType, quantity: ledger.quantity, chargeId: charge.id },
      },
    });
  }

  private async fulfillConsumable(userId: string, session: Stripe.Checkout.Session) {
    const type = session.metadata?.consumableType as ConsumableType | undefined;
    if (!type) return;

    const idempotencyKey = `stripe_session_${session.id}`;
    const existing = await this.prisma.consumableLedger.findUnique({
      where: { idempotencyKey },
    });
    if (existing) return;

    const priceCents = Number(session.metadata?.priceCents ?? session.amount_total ?? 0);
    const quantity = quantityFor(type);

    await this.prisma.consumableLedger.create({
      data: {
        userId,
        type,
        quantity,
        priceCents,
        providerRef: session.id,
        idempotencyKey,
      },
    });

    const field = walletFieldFor(type);
    if (field) {
      await this.prisma.entitlementWallet.upsert({
        where: { userId },
        create: { userId, [field]: quantity },
        update: { [field]: { increment: quantity } },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'billing.consumable_fulfilled',
        meta: { type, sessionId: session.id, quantity },
      },
    });
  }

  private async resolveStripeSubscriptionId(providerRef: string): Promise<string | null> {
    if (providerRef.startsWith('sub_')) return providerRef;
    if (providerRef.startsWith('cs_')) {
      const session = await this.requireStripe().checkout.sessions.retrieve(providerRef);
      const sub = session.subscription;
      return typeof sub === 'string' ? sub : sub?.id ?? null;
    }
    return providerRef;
  }

  private appUrl(): string {
    return (this.config.get<string>('APP_URL') ?? 'http://localhost:3001').replace(/\/$/, '');
  }
}

function headerValue(
  headers: Record<string, string | string[] | undefined> | undefined,
  name: string,
): string | undefined {
  if (!headers) return undefined;
  const raw = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(raw) ? raw[0] : raw;
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function periodEndFromSubscription(remote: Stripe.Subscription): Date {
  const itemEnd = remote.items?.data?.[0]?.current_period_end;
  if (itemEnd) return new Date(itemEnd * 1000);
  return daysFromNow(30);
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const parentSub = invoice.parent?.subscription_details?.subscription;
  if (typeof parentSub === 'string') return parentSub;
  if (parentSub && typeof parentSub === 'object' && 'id' in parentSub) {
    return (parentSub as { id: string }).id;
  }
  // Older payload shapes
  const legacy = (invoice as { subscription?: string | { id?: string } | null })
    .subscription;
  if (typeof legacy === 'string') return legacy;
  return legacy?.id ?? null;
}

function quantityFor(type: ConsumableType): number {
  switch (type) {
    case ConsumableType.SUPER_LIKES_5:
      return 5;
    default:
      return 1;
  }
}

function walletFieldFor(
  type: ConsumableType,
): 'superLikeBalance' | 'boostBalance' | 'dmBalance' | 'spotlightBalance' | null {
  switch (type) {
    case ConsumableType.SUPER_LIKES_5:
      return 'superLikeBalance';
    case ConsumableType.BOOST_30:
      return 'boostBalance';
    case ConsumableType.FIRST_MESSAGE:
      return 'dmBalance';
    case ConsumableType.SPOTLIGHT_30:
      return 'spotlightBalance';
    default:
      return null;
  }
}
