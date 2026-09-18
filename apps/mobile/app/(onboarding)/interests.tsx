import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { DEFAULT_INTERESTS } from '@flirty/shared';
import { OnboardingShell } from './_shell';
import { useUiStore } from '../../src/store/ui';
import { colors } from '../../src/theme/colors';
import { radii } from '../../src/theme/typography';

export default function InterestsScreen() {
  const router = useRouter();
  const setOnboarding = useUiStore((s) => s.setOnboarding);
  const draft = useUiStore((s) => s.onboarding);
  const [selected, setSelected] = useState<string[]>(draft.interestLabels ?? []);

  const toggle = (item: string) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item].slice(0, 10),
    );
  };

  const goNext = () => {
    setOnboarding({ interestLabels: selected });
    router.push('/(onboarding)/photos');
  };

  return (
    <OnboardingShell
      progress={0.88}
      title="Interests"
      subtitle={`${selected.length} / 10 selected`}
      showSkip
      onSkip={goNext}
      nextDisabled={selected.length === 0}
      onNext={goNext}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.wrap}>
        {DEFAULT_INTERESTS.map((item) => {
          const on = selected.includes(item);
          return (
            <Pressable
              key={item}
              style={[styles.pill, on && styles.pillOn]}
              onPress={() => toggle(item)}
            >
              <Text style={[styles.text, on && styles.textOn]}>{item}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 24,
  },
  pill: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillOn: {
    borderColor: colors.brandMagenta,
    backgroundColor: '#FFF0F5',
  },
  text: { fontSize: 14, color: colors.textPrimary },
  textOn: { fontWeight: '700', color: colors.brandMagenta },
});
