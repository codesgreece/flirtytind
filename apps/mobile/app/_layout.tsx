import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppProviders } from '../src/providers/AppProviders';
import { useAuthStore } from '../src/store/auth';
import { colors } from '../src/theme/colors';

function AuthGate({ children }: { children: React.ReactNode }) {
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    const root = segments[0];
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

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="auto" />
      <AuthGate>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }}>
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
    </AppProviders>
  );
}
