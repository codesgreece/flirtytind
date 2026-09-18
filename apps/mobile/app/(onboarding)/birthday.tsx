import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from './_shell';
import { useUiStore } from '../../src/store/ui';
import { colors } from '../../src/theme/colors';

function slotsFromDigits(digits: string) {
  const d = digits.replace(/\D/g, '').slice(0, 8);
  return {
    dd: d.slice(0, 2),
    mm: d.slice(2, 4),
    yyyy: d.slice(4, 8),
  };
}

export default function BirthdayScreen() {
  const router = useRouter();
  const setOnboarding = useUiStore((s) => s.setOnboarding);
  const [digits, setDigits] = useState('');

  const { dd, mm, yyyy } = slotsFromDigits(digits);

  const birthDate = useMemo(() => {
    if (dd.length === 2 && mm.length === 2 && yyyy.length === 4) {
      return `${yyyy}-${mm}-${dd}`;
    }
    return null;
  }, [dd, mm, yyyy]);

  const valid = (() => {
    if (!birthDate) return false;
    const date = new Date(birthDate);
    if (Number.isNaN(date.getTime())) return false;
    const age =
      (Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return age >= 18 && age < 120;
  })();

  return (
    <OnboardingShell
      progress={0.15}
      title="Your b-day?"
      nextDisabled={!valid}
      onNext={() => {
        if (!birthDate) return;
        setOnboarding({ birthDate });
        router.push('/(onboarding)/gender');
      }}
    >
      <View style={styles.row}>
        <DigitGroup value={dd} placeholder="DD" />
        <Text style={styles.slash}>/</Text>
        <DigitGroup value={mm} placeholder="MM" />
        <Text style={styles.slash}>/</Text>
        <DigitGroup value={yyyy} placeholder="YYYY" wide />
      </View>
      <TextInput
        value={digits}
        onChangeText={setDigits}
        keyboardType="number-pad"
        style={styles.hidden}
        autoFocus
        maxLength={8}
      />
      <Text style={styles.hint}>Your profile shows your age, not your date of birth.</Text>
    </OnboardingShell>
  );
}

function DigitGroup({
  value,
  placeholder,
  wide,
}: {
  value: string;
  placeholder: string;
  wide?: boolean;
}) {
  const chars = placeholder.split('');
  return (
    <View style={[styles.group, wide && styles.wide]}>
      {chars.map((ph, i) => (
        <View key={i} style={styles.digit}>
          <Text style={[styles.digitText, !value[i] && styles.ph]}>
            {value[i] ?? ph}
          </Text>
          <View style={styles.underline} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  group: { flexDirection: 'row', gap: 4 },
  wide: {},
  digit: { width: 22, alignItems: 'center' },
  digitText: { fontSize: 22, fontWeight: '600', color: colors.black },
  ph: { color: colors.textMuted },
  underline: {
    marginTop: 4,
    height: 2,
    width: '100%',
    backgroundColor: colors.textPrimary,
  },
  slash: { fontSize: 22, color: colors.textMuted, marginBottom: 4 },
  hidden: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  hint: { marginTop: 16, color: colors.textSecondary, fontSize: 14 },
});
