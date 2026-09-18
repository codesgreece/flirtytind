import { Global, Module } from '@nestjs/common';
import { DevBillingProvider } from './dev-billing.provider';
import { StripeBillingProvider } from './stripe-billing.provider';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';

@Global()
@Module({
  controllers: [BillingController],
  providers: [DevBillingProvider, StripeBillingProvider, BillingService],
  exports: [BillingService],
})
export class BillingModule {}
