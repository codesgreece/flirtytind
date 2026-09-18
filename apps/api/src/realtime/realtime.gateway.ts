import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { REALTIME_EVENTS } from '@flirty/shared';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeEmitter } from './realtime.emitter';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

type AuthedSocket = Socket & { data: { userId?: string } };

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly presenceKey = 'presence:online';

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
    private readonly emitter: RealtimeEmitter,
  ) {}

  afterInit() {
    this.emitter.bind({
      emitToUser: (userId, event, payload) => {
        this.server.to(userRoom(userId)).emit(event, payload);
      },
      emitToConversation: (conversationId, event, payload) => {
        this.server.to(conversationRoom(conversationId)).emit(event, payload);
      },
    });

    // Attach Redis adapter asynchronously once Socket.IO server is ready
    setImmediate(() => this.attachRedisAdapter());
  }

  private attachRedisAdapter() {
    try {
      const server = this.server as Server & {
        adapter: ((v?: unknown) => unknown) & { constructor?: { name?: string } };
      };
      if (!server || typeof server.adapter !== 'function') {
        this.logger.warn('Socket.IO server not ready for Redis adapter');
        return;
      }
      const url = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
      const pub = new Redis(url);
      const sub = pub.duplicate();
      server.adapter(createAdapter(pub, sub));
      this.logger.log('Socket.IO Redis adapter attached');
    } catch (e) {
      this.logger.warn(`Redis adapter not attached: ${(e as Error).message}`);
    }
  }

  async handleConnection(client: AuthedSocket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ||
        extractBearer(client.handshake.headers.authorization);
      if (!token) {
        client.disconnect(true);
        return;
      }
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      client.data.userId = payload.sub;
      await client.join(userRoom(payload.sub));
      await this.redis.sadd(this.presenceKey, payload.sub);
      this.server.emit(REALTIME_EVENTS.USER_ONLINE, { userId: payload.sub });
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { lastSeenAt: new Date() },
      });
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthedSocket) {
    const userId = client.data.userId;
    if (!userId) return;
    // Only mark offline if no other sockets for this user
    const sockets = await this.server.in(userRoom(userId)).fetchSockets();
    if (sockets.length === 0) {
      await this.redis.srem(this.presenceKey, userId);
      this.server.emit(REALTIME_EVENTS.USER_OFFLINE, { userId });
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastSeenAt: new Date() },
      });
    }
  }

  @SubscribeMessage('conversation.join')
  async joinConversation(
    client: AuthedSocket,
    data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId || !data?.conversationId) return { ok: false };
    const part = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: data.conversationId,
          userId,
        },
      },
    });
    if (!part || part.leftAt) return { ok: false };
    await client.join(conversationRoom(data.conversationId));
    return { ok: true };
  }

  @SubscribeMessage('conversation.leave')
  async leaveConversation(
    client: AuthedSocket,
    data: { conversationId: string },
  ) {
    if (!data?.conversationId) return { ok: false };
    await client.leave(conversationRoom(data.conversationId));
    return { ok: true };
  }

  @SubscribeMessage('typing')
  async typing(
    client: AuthedSocket,
    data: { conversationId: string; isTyping: boolean },
  ) {
    const userId = client.data.userId;
    if (!userId || !data?.conversationId) return;
    client.to(conversationRoom(data.conversationId)).emit(REALTIME_EVENTS.USER_TYPING, {
      conversationId: data.conversationId,
      userId,
      isTyping: !!data.isTyping,
    });
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(userRoom(userId)).emit(event, payload);
  }

  emitToConversation(conversationId: string, event: string, payload: unknown) {
    this.server.to(conversationRoom(conversationId)).emit(event, payload);
  }
}

function userRoom(userId: string) {
  return `user:${userId}`;
}

function conversationRoom(conversationId: string) {
  return `conversation:${conversationId}`;
}

function extractBearer(header?: string): string | undefined {
  if (!header) return undefined;
  const [type, token] = header.split(' ');
  return type?.toLowerCase() === 'bearer' ? token : undefined;
}
