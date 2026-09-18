import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { registerSchema } from '@flirty/validation';
import { BackButton } from '../../src/components/BackButton';
import { UnderlineInput } from '../../src/components/UnderlineInput';
import { PillButton } from '../../src/components/PillButton';
import { BrandLogo } from '../../src/components/BrandLogo';
import { authApi } from '../../src/api/endpoints';
import { useAuthStore } from '../../src/store/auth';
import { colors } from '../../src/theme/colors';
import { ApiError } from '../../src/api/client';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const parsed = registerSchema.safeParse({ email, password });
  const valid = parsed.success;

  const onSubmit = async () => {
    if (!parsed.success) return;
    setLoading(true);
    try {
      const res = await authApi.register(parsed.data);
      await setSession({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        user: {
          ...res.user,
          onboardingComplete: false,
        },
      });
      router.replace('/(onboarding)/name');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Registration failed';
      Alert.alert('Could not create account', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <BackButton onPress={() => router.back()} />
      <View style={styles.content}>
        <BrandLogo size="sm" color={colors.brandMagenta} style={{ marginBottom: 24 }} />
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.sub}>Join Flirty Greece with your email.</Text>

        <View style={styles.fields}>
          <UnderlineInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
          />
          <UnderlineInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password (min 8 characters)"
            secureTextEntry
            onSubmit={onSubmit}
          />
        </View>

        <Text style={styles.alt} onPress={() => router.push('/(auth)/phone')}>
          Prefer phone? Continue with number
        </Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PillButton
          label="Create account"
          disabled={!valid}
          loading={loading}
          onPress={onSubmit}
          variant={valid ? 'gradient' : 'disabled'}
        />
        <Text style={styles.switch}>
          Already have an account?{' '}
          <Text style={styles.link} onPress={() => router.push('/(auth)/login')}>
            Sign in
          </Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, paddingHorizontal: 20 },
  content: { flex: 1, paddingTop: 12 },
  title: { fontSize: 28, fontWeight: '700', color: colors.black },
  sub: { fontSize: 15, color: colors.textSecondary, marginTop: 8 },
  fields: { marginTop: 32, gap: 20 },
  alt: { marginTop: 20, color: colors.linkBlue, fontWeight: '600', fontSize: 14 },
  footer: { gap: 16 },
  switch: { textAlign: 'center', color: colors.textSecondary, fontSize: 14 },
  link: { color: colors.linkBlue, fontWeight: '600' },
});
