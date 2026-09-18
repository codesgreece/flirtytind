import { Module } from '@nestjs/common';
import { TopPicksService } from './top-picks.service';
import { TopPicksController } from './top-picks.controller';

@Module({
  controllers: [TopPicksController],
  providers: [TopPicksService],
  exports: [TopPicksService],
})
export class TopPicksModule {}
