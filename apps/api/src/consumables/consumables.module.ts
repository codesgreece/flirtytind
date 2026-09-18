import { Module, forwardRef } from '@nestjs/common';
import { ConsumablesService } from './consumables.service';
import { ConsumablesController } from './consumables.controller';
import { BoostsModule } from '../boosts/boosts.module';

@Module({
  imports: [forwardRef(() => BoostsModule)],
  controllers: [ConsumablesController],
  providers: [ConsumablesService],
  exports: [ConsumablesService],
})
export class ConsumablesModule {}
