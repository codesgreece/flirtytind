import { PushService } from './push.service';

describe('PushService token pruning', () => {
  it('prunes DeviceNotRegistered tokens after Expo send', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const findMany = jest.fn().mockResolvedValue([
      { id: 'd1', pushToken: 'ExponentPushToken[good]' },
      { id: 'd2', pushToken: 'ExponentPushToken[bad]' },
    ]);

    const prisma = {
      device: { findMany, updateMany },
    } as never;

    const expo = {
      send: jest.fn().mockResolvedValue({
        sent: 1,
        failed: 1,
        invalidTokens: ['ExponentPushToken[bad]'],
      }),
    };

    const service = new PushService(prisma, expo as never);
    const result = await service.sendToUser('user-1', 'Hi', 'Body', { type: 'SYSTEM' });

    expect(expo.send).toHaveBeenCalledWith(
      expect.objectContaining({
        tokens: ['ExponentPushToken[good]', 'ExponentPushToken[bad]'],
      }),
    );
    expect(updateMany).toHaveBeenCalledWith({
      where: { pushToken: { in: ['ExponentPushToken[bad]'] } },
      data: { pushToken: null, pushEnabled: false },
    });
    expect(result.invalidTokens).toEqual(['ExponentPushToken[bad]']);
  });

  it('ExpoPushProvider marks DeviceNotRegistered as invalid', async () => {
    const { ExpoPushProvider } = await import('./expo-push.provider');
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { status: 'ok', id: '1' },
          {
            status: 'error',
            message: 'not registered',
            details: { error: 'DeviceNotRegistered' },
          },
        ],
      }),
    });
    (globalThis as { fetch: typeof fetch }).fetch = fetchMock as never;

    const provider = new ExpoPushProvider();
    const result = await provider.send({
      tokens: ['tok-a', 'tok-b'],
      title: 't',
      body: 'b',
    });

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.invalidTokens).toEqual(['tok-b']);
  });
});
