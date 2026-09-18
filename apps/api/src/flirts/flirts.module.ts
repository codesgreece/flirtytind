import { Module, forwardRef } from '@nestjs/common';
import { FlirtsService } from './flirts.service';
import { FlirtsController } from './flirts.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    forwardRef(() => RealtimeModule),
    NotificationsModule,
  ],
  controllers: [FlirtsController],
  providers: [FlirtsService],
  exports: [FlirtsService],
})
export class FlirtsModule {}
