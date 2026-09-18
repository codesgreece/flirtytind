import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '../../src/components/BackButton';
import { UnderlineInput } from '../../src/components/UnderlineInput';
import { PillButton } from '../../src/components/PillButton';
import { colors } from '../../src/theme/colors';

export default function PhoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [country, setCountry] = useState('+30');
  const [phone, setPhone] = useState('');

  const valid = phone.replace(/\D/g, '').length >= 7;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <BackButton onPress={() => router.back()} color={colors.white} />
      <View style={styles.content}>
        <Text style={styles.title}>Can we get your number?</Text>

        <View style={styles.row}>
          <View style={styles.country}>
            <UnderlineInput
              value={country}
              onChangeText={setCountry}
              dark
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.phone}>
            <UnderlineInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              dark
              keyboardType="phone-pad"
              autoFocus
            />
          </View>
        </View>

        <Text style={styles.help}>
          We never share this with anyone and it won’t be on your profile.
        </Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PillButton
          label="Next"
          disabled={!valid}
          onPress={() => router.push('/(auth)/register')}
          variant={valid ? 'gradient' : 'disabled'}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.charcoal,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    paddingTop: 24,
  },
  title: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  country: { width: 80 },
  phone: { flex: 1 },
  help: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 16,
    lineHeight: 18,
  },
  footer: {
    paddingTop: 12,
  },
});
