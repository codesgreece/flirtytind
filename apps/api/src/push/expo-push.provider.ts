import { Injectable, Logger } from '@nestjs/common';
import { PushPayload, PushProvider, PushSendResult } from './push.provider';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type ExpoTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
};

/**
 * Expo Push API — delivers to APNs/FCM for Expo apps.
 * FCM-ready: Expo handles FCM under the hood for Android tokens.
 */
@Injectable()
export class ExpoPushProvider implements PushProvider {
  private readonly logger = new Logger(ExpoPushProvider.name);

  async send(params: PushPayload): Promise<PushSendResult> {
    const tokens = params.tokens.filter((t) => !!t && t.length > 0);
    if (tokens.length === 0) {
      return { sent: 0, failed: 0, invalidTokens: [] };
    }

    const messages = tokens.map((to) => ({
      to,
      title: params.title,
      body: params.body,
      data: params.data ?? {},
      sound: 'default' as const,
    }));

    let tickets: ExpoTicket[] = [];
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
      if (!res.ok) {
        this.logger.warn(`Expo push HTTP ${res.status}`);
        return { sent: 0, failed: tokens.length, invalidTokens: [] };
      }
      const json = (await res.json()) as { data?: ExpoTicket[] };
      tickets = json.data ?? [];
    } catch (e) {
      this.logger.warn(`Expo push failed: ${(e as Error).message}`);
      return { sent: 0, failed: tokens.length, invalidTokens: [] };
    }

    const invalidTokens: string[] = [];
    let sent = 0;
    let failed = 0;

    tickets.forEach((ticket, idx) => {
      if (ticket.status === 'ok') {
        sent += 1;
        return;
      }
      failed += 1;
      const err = ticket.details?.error;
      if (err === 'DeviceNotRegistered' && tokens[idx]) {
        invalidTokens.push(tokens[idx]);
      }
    });

    return { sent, failed, invalidTokens };
  }
}
