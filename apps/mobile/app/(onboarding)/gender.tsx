import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Gender } from '@flirty/shared';
import { OnboardingShell } from './_shell';
import { ChoicePill } from '../../src/components/ChoicePill';
import { CheckboxRow } from '../../src/components/UnderlineInput';
import { useUiStore } from '../../src/store/ui';

export default function GenderScreen() {
  const router = useRouter();
  const setOnboarding = useUiStore((s) => s.setOnboarding);
  const draft = useUiStore((s) => s.onboarding);
  const [gender, setGender] = useState<Gender | undefined>(draft.gender);
  const [show, setShow] = useState(draft.showGenderOnProfile ?? true);

  return (
    <OnboardingShell
      progress={0.2}
      title="What’s your gender?"
      nextDisabled={!gender}
      onNext={() => {
        setOnboarding({ gender, showGenderOnProfile: show });
        router.push('/(onboarding)/orientation');
      }}
      footer={
        <CheckboxRow
          checked={show}
          onToggle={() => setShow((v) => !v)}
          label="Show my gender on my profile"
        />
      }
    >
      <View style={styles.list}>
        <ChoicePill
          label="Woman"
          selected={gender === Gender.WOMAN}
          onPress={() => setGender(Gender.WOMAN)}
        />
        <ChoicePill
          label="Man"
          selected={gender === Gender.MAN}
          onPress={() => setGender(Gender.MAN)}
        />
        <ChoicePill
          label="More"
          selected={gender === Gender.NON_BINARY || gender === Gender.OTHER}
          onPress={() => setGender(Gender.NON_BINARY)}
        />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
});
