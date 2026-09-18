export type PushPayload = {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export type PushSendResult = {
  sent: number;
  failed: number;
  invalidTokens: string[];
};

export interface PushProvider {
  send(params: PushPayload): Promise<PushSendResult>;
}
