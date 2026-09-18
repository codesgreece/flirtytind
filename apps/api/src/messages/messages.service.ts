import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SendMessageInput } from '@flirty/validation';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { RealtimeEmitter } from '../realtime/realtime.emitter';
import { NotificationsService } from '../notifications/notifications.service';
import { REALTIME_EVENTS } from '@flirty/shared';

type DmInput = { targetUserId: string; body: string };

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly realtime: RealtimeEmitter,
    private readonly notifications: NotificationsService,
  ) {}

  async listConversations(userId: string) {
    const parts = await this.prisma.conversationParticipant.findMany({
      where: { userId, leftAt: null },
      include: {
        conversation: {
          include: {
            participants: {
              where: { userId: { not: userId } },
              include: {
                user: {
                  select: {
                    id: true,
                    profile: true,
                    photos: { orderBy: { sortOrder: 'asc' }, take: 1 },
                  },
                },
              },
            },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            match: true,
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    return parts.map((p) => {
      const other = p.conversation.participants[0]?.user;
      return {
        id: p.conversation.id,
        isDirect: p.conversation.isDirect,
        matchId: p.conversation.matchId,
        updatedAt: p.conversation.updatedAt,
        lastReadAt: p.lastReadAt,
        lastMessage: p.conversation.messages[0] ?? null,
        otherUser: other
          ? {
              id: other.id,
              firstName: other.profile?.firstName ?? null,
              photo: other.photos[0] ?? null,
            }
          : null,
      };
    });
  }

  async history(userId: string, conversationId: string, cursor?: string, limit = 50) {
    await this.assertParticipant(userId, conversationId);
    const take = Math.min(Math.max(limit, 1), 100);

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
    });

    const hasMore = messages.length > take;
    const items = hasMore ? messages.slice(0, take) : messages;
    const nextCursor = hasMore ? items[items.length - 1]?.createdAt.toISOString() : null;

    return { items: items.reverse(), nextCursor };
  }

  async send(userId: string, input: SendMessageInput) {
    await this.assertParticipant(userId, input.conversationId);

    if (input.clientMessageId) {
      const existing = await this.prisma.message.findUnique({
        where: {
          conversationId_clientMessageId: {
            conversationId: input.conversationId,
            clientMessageId: input.clientMessageId,
          },
        },
      });
      if (existing) return existing;
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: input.conversationId,
        senderId: userId,
        body: input.body,
        clientMessageId: input.clientMessageId,
      },
    });

    await this.prisma.conversation.update({
      where: { id: input.conversationId },
      data: { updatedAt: new Date() },
    });

    const others = await this.prisma.conversationParticipant.findMany({
      where: { conversationId: input.conversationId, userId: { not: userId }, leftAt: null },
    });

    for (const o of others) {
      await this.notifications.create({
        userId: o.userId,
        type: 'MESSAGE',
        title: 'New message',
        body: input.body.slice(0, 120),
        data: { conversationId: input.conversationId, messageId: message.id },
      });
      this.realtime.emitToUser(o.userId, REALTIME_EVENTS.MESSAGE_CREATED, message);
      this.realtime.emitToUser(o.userId, REALTIME_EVENTS.NOTIFICATION_CREATED, {
        type: 'MESSAGE',
      });
    }

    this.realtime.emitToConversation(
      input.conversationId,
      REALTIME_EVENTS.MESSAGE_CREATED,
      message,
    );

    return message;
  }

  async markRead(userId: string, conversationId: string) {
    await this.assertParticipant(userId, conversationId);
    const now = new Date();

    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data: { lastReadAt: now },
    });

    const unread = await this.prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
        status: { not: 'READ' },
      },
      select: { id: true },
    });

    if (unread.length > 0) {
      await this.prisma.message.updateMany({
        where: { id: { in: unread.map((m) => m.id) } },
        data: { status: 'READ' },
      });
      await this.prisma.messageRead.createMany({
        data: unread.map((m) => ({ messageId: m.id, userId, readAt: now })),
        skipDuplicates: true,
      });
    }

    this.realtime.emitToConversation(conversationId, REALTIME_EVENTS.MESSAGE_READ, {
      conversationId,
      userId,
      readAt: now,
    });

    return { ok: true, readAt: now };
  }

  async directMessage(userId: string, input: DmInput) {
    if (input.targetUserId === userId) {
      throw new ForbiddenException('Cannot message yourself');
    }

    const status = await this.entitlements.getStatus(userId);
    if (!status.messageBeforeMatch && status.wallet.dmBalance <= 0 && status.dmsPerDay === 0) {
      // Free plan has dmsPerDay: 1 — allow that path via assertCanDm
    }
    const dmCheck = await this.entitlements.assertCanDm(userId);

    // If already matched, use match conversation
    const [a, b] = userId < input.targetUserId ? [userId, input.targetUserId] : [input.targetUserId, userId];
    const match = await this.prisma.match.findUnique({
      where: { userAId_userBId: { userAId: a, userBId: b } },
      include: { conversation: true },
    });

    let conversationId: string;

    if (match?.conversation && !match.unmatchedAt) {
      conversationId = match.conversation.id;
    } else {
      // Find existing direct conversation between these users
      const existing = await this.prisma.conversation.findFirst({
        where: {
          isDirect: true,
          AND: [
            { participants: { some: { userId } } },
            { participants: { some: { userId: input.targetUserId } } },
          ],
        },
      });

      if (existing) {
        conversationId = existing.id;
      } else {
        if (!status.messageBeforeMatch && status.wallet.dmBalance <= 0) {
          // Still allow limited free DMs via daily counter for non-platinum
          // assertCanDm already validated
        }
        const conv = await this.prisma.conversation.create({
          data: {
            isDirect: true,
            participants: {
              create: [{ userId }, { userId: input.targetUserId }],
            },
          },
        });
        conversationId = conv.id;
      }

      await this.entitlements.recordDmUsage(userId, dmCheck.useWallet);
    }

    return this.send(userId, {
      conversationId,
      body: input.body,
    });
  }

  private async assertParticipant(userId: string, conversationId: string) {
    const part = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });
    if (!part || part.leftAt) {
      throw new NotFoundException('Conversation not found');
    }
  }
}
