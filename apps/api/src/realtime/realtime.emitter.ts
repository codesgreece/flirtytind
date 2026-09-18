import { Injectable } from '@nestjs/common';
import { REALTIME_EVENTS, RealtimeEvent } from '@flirty/shared';

/**
 * Thin emitter used by domain services. Bound to the Socket.IO gateway at runtime.
 */
@Injectable()
export class RealtimeEmitter {
  private gateway: {
    emitToUser(userId: string, event: string, payload: unknown): void;
    emitToConversation(conversationId: string, event: string, payload: unknown): void;
  } | null = null;

  bind(gateway: NonNullable<typeof this.gateway>) {
    this.gateway = gateway;
  }

  emitToUser(userId: string, event: RealtimeEvent | string, payload: unknown) {
    this.gateway?.emitToUser(userId, event, payload);
  }

  emitToConversation(
    conversationId: string,
    event: RealtimeEvent | string,
    payload: unknown,
  ) {
    this.gateway?.emitToConversation(conversationId, event, payload);
  }

  // Keep reference so tree-shaking / unused import doesn't drop events constant usage in types
  readonly events = REALTIME_EVENTS;
}
