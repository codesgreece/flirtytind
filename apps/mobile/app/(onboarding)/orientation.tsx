import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from './_shell';
import { CheckboxRow } from '../../src/components/UnderlineInput';
import { useUiStore } from '../../src/store/ui';
import { colors } from '../../src/theme/colors';

const OPTIONS = [
  'Straight',
  'Gay',
  'Lesbian',
  'Bisexual',
  'Asexual',
  'Demisexual',
  'Pansexual',
  'Queer',
  'Questioning',
];

export default function OrientationScreen() {
  const router = useRouter();
  const setOnboarding = useUiStore((s) => s.setOnboarding);
  const draft = useUiStore((s) => s.onboarding);
  const [selected, setSelected] = useState<string[]>(draft.orientations ?? []);
  const [show, setShow] = useState(draft.showOrientationOnProfile ?? false);

  const toggle = (item: string) => {
    setSelected((prev) => {
      if (prev.includes(item)) return prev.filter((x) => x !== item);
      if (prev.length >= 3) return prev;
      return [...prev, item];
    });
  };

  const goNext = () => {
    setOnboarding({ orientations: selected, showOrientationOnProfile: show });
    router.push('/(onboarding)/interested-in');
  };

  return (
    <OnboardingShell
      progress={0.3}
      title="Your sexual orientation?"
      subtitle="Select up to 3"
      showSkip
      onSkip={goNext}
      nextDisabled={selected.length === 0}
      onNext={goNext}
      footer={
        <CheckboxRow
          checked={show}
          onToggle={() => setShow((v) => !v)}
          label="Show my orientation on my profile"
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {OPTIONS.map((item) => {
          const on = selected.includes(item);
          return (
            <Pressable key={item} style={styles.row} onPress={() => toggle(item)}>
              <Text style={[styles.label, on && styles.labelOn]}>{item}</Text>
              {on ? <Text style={styles.check}>✓</Text> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  label: { fontSize: 17, color: colors.textPrimary },
  labelOn: { fontWeight: '700' },
  check: { fontSize: 18, color: colors.brandMagenta, fontWeight: '700' },
});
