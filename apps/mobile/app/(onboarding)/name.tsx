import { useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from './_shell';
import { UnderlineInput } from '../../src/components/UnderlineInput';
import { useUiStore } from '../../src/store/ui';
import { colors } from '../../src/theme/colors';

export default function NameScreen() {
  const router = useRouter();
  const setOnboarding = useUiStore((s) => s.setOnboarding);
  const existing = useUiStore((s) => s.onboarding.firstName);
  const [name, setName] = useState(existing ?? '');

  const valid = name.trim().length >= 1;

  return (
    <OnboardingShell
      progress={0.05}
      title="What’s your first name?"
      nextDisabled={!valid}
      onNext={() => {
        setOnboarding({ firstName: name.trim() });
        router.push('/(onboarding)/birthday');
      }}
    >
      <UnderlineInput
        value={name}
        onChangeText={setName}
        placeholder="Enter first name"
        autoCapitalize="words"
        autoFocus
        onSubmit={() => {
          if (!valid) return;
          setOnboarding({ firstName: name.trim() });
          router.push('/(onboarding)/birthday');
        }}
      />
      <Text style={styles.hint}>This is how it’ll appear on your profile.</Text>
      <Text style={styles.warn}>Can’t change it later.</Text>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.textSecondary, marginTop: 12, fontSize: 14 },
  warn: { color: colors.textSecondary, marginTop: 6, fontSize: 14, fontWeight: '700' },
});
