import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../store/auth';
import { devicesApi } from '../api/endpoints';
import { ApiError } from '../api/client';

/**
 * Registers the device push token with POST /api/v1/devices/register when logged in.
 * Skips native push APIs on web (browser Notification API can be added later).
 */
export function useDeviceRegistration() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const lastToken = useRef<string | null>(null);

  useEffect(() => {
    if (!hydrated || !accessToken) return;
    if (Platform.OS === 'web') return;

    let cancelled = false;

    const run = async () => {
      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }

        const { status: existing } = await Notifications.getPermissionsAsync();
        let status = existing;
        if (existing !== 'granted') {
          const req = await Notifications.requestPermissionsAsync();
          status = req.status;
        }
        if (status !== 'granted' || cancelled) return;

        const projectId =
          Constants.easConfig?.projectId ??
          (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
            ?.projectId;

        const push = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );
        const token = push.data;
        if (!token || token === lastToken.current || cancelled) return;

        await devicesApi.register({
          pushToken: token,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
        });
        lastToken.current = token;
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return;
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.debug('[devices] register skipped', err);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [hydrated, accessToken]);
}
