import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  async create(params: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Prisma.InputJsonValue;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: params.data ?? undefined,
      },
    });

    // Fire-and-forget push; failures should not break API responses
    void this.push
      .sendToUser(params.userId, params.title, params.body, {
        type: params.type,
        notificationId: notification.id,
        ...(typeof params.data === 'object' && params.data && !Array.isArray(params.data)
          ? (params.data as Record<string, unknown>)
          : {}),
      })
      .catch(() => undefined);

    return notification;
  }

  async list(userId: string, cursor?: string, limit = 30) {
    const take = Math.min(Math.max(limit, 1), 100);
    const items = await this.prisma.notification.findMany({
      where: {
        userId,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
    });
    const hasMore = items.length > take;
    const page = hasMore ? items.slice(0, take) : items;
    return {
      items: page,
      nextCursor: hasMore ? page[page.length - 1]?.createdAt.toISOString() : null,
    };
  }

  async markRead(userId: string, ids?: string[]) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
        ...(ids?.length ? { id: { in: ids } } : {}),
      },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }
}
