import { Global, Module } from '@nestjs/common';
import { ExpoPushProvider } from './expo-push.provider';
import { PushService } from './push.service';
import { DevicesController } from './devices.controller';

@Global()
@Module({
  controllers: [DevicesController],
  providers: [ExpoPushProvider, PushService],
  exports: [PushService],
})
export class PushModule {}
