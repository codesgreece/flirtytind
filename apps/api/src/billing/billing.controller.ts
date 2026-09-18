import {
  Controller,
  Headers,
  Post,
  Req,
  RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  /**
   * Stripe (and other providers) webhook. Requires raw body for signature verification.
   * Configured via NestFactory rawBody: true in main.ts.
   */
  @Post('webhook')
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') stripeSignature?: string,
  ) {
    const rawBody = req.rawBody ?? (req.body as Buffer | string | undefined);
    if (!rawBody) {
      return { handled: false, eventId: '', type: 'missing_body' };
    }
    return this.billing.handleWebhook({
      rawBody,
      signature: stripeSignature,
      headers: req.headers as Record<string, string | string[] | undefined>,
    });
  }
}
