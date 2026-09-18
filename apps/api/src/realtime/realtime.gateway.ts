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
import { REALTIME_EVENTS } from '@flirty/shared';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeEmitter } from './realtime.emitter';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

type AuthedSocket = Socket & { data: { userId?: string } };

const PRESENCE_TTL_SECONDS = 60;

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
    // Redis adapter is attached in main.ts via RedisIoAdapter — do not re-attach here.
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

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, status: true },
      });
      if (!user || user.status !== 'ACTIVE') {
        client.disconnect(true);
        return;
      }

      client.data.userId = payload.sub;
      await client.join(userRoom(payload.sub));
      await this.touchPresence(payload.sub);
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
    const sockets = await this.server.in(userRoom(userId)).fetchSockets();
    if (sockets.length === 0) {
      await this.redis.del(presenceKey(userId));
      this.server.emit(REALTIME_EVENTS.USER_OFFLINE, { userId });
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastSeenAt: new Date() },
      });
    }
  }

  @SubscribeMessage('presence.heartbeat')
  async heartbeat(client: AuthedSocket) {
    const userId = client.data.userId;
    if (!userId) return { ok: false };
    await this.touchPresence(userId);
    return { ok: true };
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

    const part = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: data.conversationId,
          userId,
        },
      },
    });
    if (!part || part.leftAt) return;

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

  private async touchPresence(userId: string) {
    await this.redis.set(presenceKey(userId), '1', PRESENCE_TTL_SECONDS);
  }
}

function userRoom(userId: string) {
  return `user:${userId}`;
}

function conversationRoom(conversationId: string) {
  return `conversation:${conversationId}`;
}

function presenceKey(userId: string) {
  return `presence:user:${userId}`;
}

function extractBearer(header?: string): string | undefined {
  if (!header) return undefined;
  const [type, token] = header.split(' ');
  return type?.toLowerCase() === 'bearer' ? token : undefined;
}
