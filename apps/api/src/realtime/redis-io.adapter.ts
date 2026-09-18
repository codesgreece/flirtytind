import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions, Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

/**
 * Production Socket.IO adapter using Redis pub/sub for multi-instance fan-out.
 * Attach via `app.useWebSocketAdapter(new RedisIoAdapter(app))` before listen.
 */
export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;
  private pubClient: Redis | null = null;
  private subClient: Redis | null = null;

  constructor(private readonly app: INestApplication) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const config = this.app.get(ConfigService);
    const url = config.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.pubClient = new Redis(url, { maxRetriesPerRequest: null, lazyConnect: false });
    this.subClient = this.pubClient.duplicate();
    this.adapterConstructor = createAdapter(this.pubClient, this.subClient);
    this.logger.log('Redis IO adapter connected');
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    } else {
      this.logger.warn('Redis adapter not connected; using in-memory Socket.IO adapter');
    }
    return server;
  }

  async close(): Promise<void> {
    try {
      await this.pubClient?.quit();
    } catch {
      this.pubClient?.disconnect();
    }
    try {
      await this.subClient?.quit();
    } catch {
      this.subClient?.disconnect();
    }
    this.pubClient = null;
    this.subClient = null;
    this.adapterConstructor = null;
  }
}
