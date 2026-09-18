import { Module, forwardRef } from '@nestjs/common';
import { SwipesService } from './swipes.service';
import { SwipesController } from './swipes.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [
    forwardRef(() => RealtimeModule),
    PushModule,
  ],
  controllers: [SwipesController],
  providers: [SwipesService],
  exports: [SwipesService],
})
export class SwipesModule {}
