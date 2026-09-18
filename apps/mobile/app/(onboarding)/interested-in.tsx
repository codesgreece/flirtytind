import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ShowMe } from '@flirty/shared';
import { OnboardingShell } from './_shell';
import { ChoicePill } from '../../src/components/ChoicePill';
import { useUiStore } from '../../src/store/ui';

export default function InterestedInScreen() {
  const router = useRouter();
  const setOnboarding = useUiStore((s) => s.setOnboarding);
  const draft = useUiStore((s) => s.onboarding);
  const [showMe, setShowMe] = useState<ShowMe | undefined>(draft.showMe);

  return (
    <OnboardingShell
      progress={0.35}
      title="Who are you interested in seeing?"
      nextDisabled={!showMe}
      onNext={() => {
        setOnboarding({ showMe });
        router.push('/(onboarding)/looking-for');
      }}
    >
      <View style={styles.list}>
        <ChoicePill
          label="Women"
          selected={showMe === ShowMe.WOMEN}
          onPress={() => setShowMe(ShowMe.WOMEN)}
        />
        <ChoicePill
          label="Men"
          selected={showMe === ShowMe.MEN}
          onPress={() => setShowMe(ShowMe.MEN)}
        />
        <ChoicePill
          label="Everyone"
          selected={showMe === ShowMe.EVERYONE}
          onPress={() => setShowMe(ShowMe.EVERYONE)}
        />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
});
