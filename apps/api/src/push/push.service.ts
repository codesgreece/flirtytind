import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExpoPushProvider } from './expo-push.provider';
import { PushSendResult } from './push.provider';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly expo: ExpoPushProvider,
  ) {}

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<PushSendResult> {
    const devices = await this.prisma.device.findMany({
      where: {
        userId,
        pushEnabled: true,
        pushToken: { not: null },
      },
      select: { id: true, pushToken: true },
    });

    const tokens = devices
      .map((d) => d.pushToken)
      .filter((t): t is string => !!t);

    if (tokens.length === 0) {
      return { sent: 0, failed: 0, invalidTokens: [] };
    }

    const result = await this.expo.send({ tokens, title, body, data });
    await this.pruneInvalidTokens(result.invalidTokens);
    return result;
  }

  async pruneInvalidTokens(tokens: string[]): Promise<number> {
    if (!tokens.length) return 0;
    const res = await this.prisma.device.updateMany({
      where: { pushToken: { in: tokens } },
      data: { pushToken: null, pushEnabled: false },
    });
    if (res.count > 0) {
      this.logger.log(`Pruned ${res.count} invalid push token(s)`);
    }
    return res.count;
  }

  async registerDevice(
    userId: string,
    input: { pushToken: string; platform?: string },
  ) {
    const existing = await this.prisma.device.findFirst({
      where: { userId, pushToken: input.pushToken },
    });
    if (existing) {
      return this.prisma.device.update({
        where: { id: existing.id },
        data: {
          platform: input.platform ?? existing.platform,
          pushEnabled: true,
          lastSeenAt: new Date(),
        },
      });
    }
    return this.prisma.device.create({
      data: {
        userId,
        pushToken: input.pushToken,
        platform: input.platform,
        pushEnabled: true,
      },
    });
  }

  async unregisterDevice(userId: string, pushToken: string) {
    await this.prisma.device.updateMany({
      where: { userId, pushToken },
      data: { pushToken: null, pushEnabled: false },
    });
    return { ok: true };
  }
}
