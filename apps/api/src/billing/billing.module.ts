import { Global, Module } from '@nestjs/common';
import { DevBillingProvider } from './dev-billing.provider';
import { BillingService } from './billing.service';

@Global()
@Module({
  providers: [DevBillingProvider, BillingService],
  exports: [BillingService],
})
export class BillingModule {}
