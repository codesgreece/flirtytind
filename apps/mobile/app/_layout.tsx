import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { AppProviders } from '../src/providers/AppProviders';
import { useAuthStore } from '../src/store/auth';
import { colors } from '../src/theme/colors';
import { useResponsive } from '../src/layout/useResponsive';

function AuthGate({ children }: { children: React.ReactNode }) {
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    const root = segments[0] as string | undefined;
    const inAuth = root === '(auth)';
    const inOnboarding = root === '(onboarding)';
    const atIndex = !root || root === 'index';

    if (!accessToken) {
      if (!inAuth && !atIndex) {
        router.replace('/(auth)/welcome');
      }
      return;
    }

    if (user && user.onboardingComplete === false) {
      if (!inOnboarding) router.replace('/(onboarding)/name');
      return;
    }

    if (inAuth || atIndex) {
      router.replace('/(tabs)/discover');
    }
  }, [hydrated, accessToken, user, segments, router]);

  return <>{children}</>;
}

function WebFrame({ children }: { children: React.ReactNode }) {
  const { isWeb, isTablet, contentMaxWidth } = useResponsive();

  if (!isWeb) {
    return <View style={styles.fill}>{children}</View>;
  }

  return (
    <View style={[styles.webOuter, isTablet && styles.webOuterDesktop]}>
      <View
        style={[
          styles.webFrame,
          {
            maxWidth: contentMaxWidth,
            width: '100%',
            ...(isTablet
              ? {
                  borderLeftWidth: StyleSheet.hairlineWidth,
                  borderRightWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.border,
                  shadowColor: '#000',
                  shadowOpacity: 0.08,
                  shadowRadius: 24,
                  shadowOffset: { width: 0, height: 8 },
                }
              : null),
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="auto" />
      <WebFrame>
        <AuthGate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.white },
              animation: Platform.OS === 'web' ? 'fade' : 'default',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="chat/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="profile/[id]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="settings/index" />
            <Stack.Screen name="settings/discovery" options={{ presentation: 'modal' }} />
            <Stack.Screen name="settings/premium" options={{ presentation: 'modal' }} />
            <Stack.Screen name="match/[id]" options={{ presentation: 'transparentModal' }} />
          </Stack>
        </AuthGate>
      </WebFrame>
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  webOuter: {
    flex: 1,
    width: '100%',
    minHeight: '100%' as unknown as number,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  webOuterDesktop: {
    backgroundColor: colors.bgLavenderAlt,
  },
  webFrame: {
    flex: 1,
    height: '100%' as unknown as number,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
});
