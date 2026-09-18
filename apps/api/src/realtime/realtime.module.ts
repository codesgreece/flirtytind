import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeEmitter } from './realtime.emitter';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [RealtimeGateway, RealtimeEmitter],
  exports: [RealtimeGateway, RealtimeEmitter],
})
export class RealtimeModule {}
