import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from './_shell';
import { useUiStore } from '../../src/store/ui';
import { colors } from '../../src/theme/colors';
import { radii } from '../../src/theme/typography';

const SECTIONS: { key: 'drinking' | 'smoking' | 'workout' | 'pets'; title: string; options: string[] }[] = [
  {
    key: 'drinking',
    title: 'Drinking',
    options: ['Not for me', 'Sober', 'Sober curious', 'On special occasions', 'Socially, at the weekend', 'Most nights'],
  },
  {
    key: 'smoking',
    title: 'Smoking',
    options: ['Non-smoker', 'Social smoker', 'Smoker when drinking', 'Smoker', 'Trying to quit'],
  },
  {
    key: 'workout',
    title: 'Workout',
    options: ['Never', 'Sometimes', 'Often', 'Daily'],
  },
  {
    key: 'pets',
    title: 'Pets',
    options: ["Don't have, but love", 'Dog', 'Cat', 'Other', 'Want a pet', 'Allergic', 'Pet-free'],
  },
];

export default function LifestyleScreen() {
  const router = useRouter();
  const setOnboarding = useUiStore((s) => s.setOnboarding);
  const draft = useUiStore((s) => s.onboarding);
  const firstName = draft.firstName ?? 'there';
  const [values, setValues] = useState({
    drinking: draft.drinking,
    smoking: draft.smoking,
    workout: draft.workout,
    pets: draft.pets,
  });

  const hasAny = Object.values(values).some(Boolean);

  const goNext = () => {
    setOnboarding(values);
    router.push('/(onboarding)/interests');
  };

  return (
    <OnboardingShell
      progress={0.75}
      title={`Hey ${firstName}, let’s talk lifestyle habits`}
      showSkip
      onSkip={goNext}
      nextDisabled={!hasAny}
      onNext={goNext}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 24, paddingBottom: 24 }}>
        {SECTIONS.map((section) => (
          <View key={section.key}>
            <Text style={styles.section}>{section.title}</Text>
            <View style={styles.wrap}>
              {section.options.map((opt) => {
                const on = values[section.key] === opt;
                return (
                  <Pressable
                    key={opt}
                    style={[styles.chip, on && styles.chipOn]}
                    onPress={() => setValues((v) => ({ ...v, [section.key]: opt }))}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{opt}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  section: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 10,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  chipOn: {
    borderColor: colors.black,
    backgroundColor: colors.bgGray,
  },
  chipText: { fontSize: 14, color: colors.textPrimary },
  chipTextOn: { fontWeight: '700' },
});
