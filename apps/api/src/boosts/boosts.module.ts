import { Module, forwardRef } from '@nestjs/common';
import { BoostsService } from './boosts.service';
import { BoostsController } from './boosts.controller';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [forwardRef(() => RealtimeModule)],
  controllers: [BoostsController],
  providers: [BoostsService],
  exports: [BoostsService],
})
export class BoostsModule {}
