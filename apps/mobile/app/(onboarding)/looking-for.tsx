import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LookingFor, LOOKING_FOR_LABELS } from '@flirty/shared';
import { OnboardingShell } from './_shell';
import { useUiStore } from '../../src/store/ui';
import { colors } from '../../src/theme/colors';
import { radii } from '../../src/theme/typography';

const OPTIONS = Object.values(LookingFor);

export default function LookingForScreen() {
  const router = useRouter();
  const setOnboarding = useUiStore((s) => s.setOnboarding);
  const draft = useUiStore((s) => s.onboarding);
  const [value, setValue] = useState<LookingFor | undefined>(draft.lookingFor);

  return (
    <OnboardingShell
      progress={0.5}
      title="What are you looking for?"
      nextDisabled={!value}
      onNext={() => {
        setOnboarding({ lookingFor: value });
        router.push('/(onboarding)/lifestyle');
      }}
    >
      <View style={styles.grid}>
        {OPTIONS.map((key) => {
          const meta = LOOKING_FOR_LABELS[key];
          const selected = value === key;
          return (
            <Pressable
              key={key}
              style={[styles.card, selected && styles.cardOn]}
              onPress={() => setValue(key)}
            >
              <Text style={styles.emoji}>{meta.emoji}</Text>
              <Text style={styles.label}>{meta.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 16,
    minHeight: 110,
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  cardOn: {
    borderColor: colors.black,
    backgroundColor: colors.bgGray,
  },
  emoji: { fontSize: 28, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
});
