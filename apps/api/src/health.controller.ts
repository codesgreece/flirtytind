import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check() {
    let db = 'ok';
    let redis = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'error';
    }
    try {
      const pong = await this.redis.ping();
      if (pong !== 'PONG') redis = 'error';
    } catch {
      redis = 'error';
    }
    return {
      status: db === 'ok' && redis === 'ok' ? 'ok' : 'degraded',
      db,
      redis,
      ts: new Date().toISOString(),
    };
  }
}
