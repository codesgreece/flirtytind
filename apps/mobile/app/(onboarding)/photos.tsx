import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from './_shell';
import { PhotoGrid } from '../../src/components/PhotoGrid';
import { useUiStore } from '../../src/store/ui';
import { useAuthStore } from '../../src/store/auth';
import { profilesApi, preferencesApi } from '../../src/api/endpoints';
import { colors } from '../../src/theme/colors';
import { ApiError } from '../../src/api/client';

export default function PhotosScreen() {
  const router = useRouter();
  const draft = useUiStore((s) => s.onboarding);
  const setOnboarding = useUiStore((s) => s.setOnboarding);
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const [uris, setUris] = useState<string[]>(draft.photoUris ?? []);
  const [loading, setLoading] = useState(false);

  const valid = uris.length >= 2;

  const finish = async () => {
    setOnboarding({ photoUris: uris });
    setLoading(true);
    try {
      await profilesApi.updateMe({
        firstName: draft.firstName,
        birthDate: draft.birthDate,
        gender: draft.gender,
        showGenderOnProfile: draft.showGenderOnProfile,
        orientations: draft.orientations,
        showOrientationOnProfile: draft.showOrientationOnProfile,
        lookingFor: draft.lookingFor,
        drinking: draft.drinking,
        smoking: draft.smoking,
        workout: draft.workout,
        pets: draft.pets,
      });

      if (draft.showMe) {
        await preferencesApi.update({ showMe: draft.showMe });
      }

      for (const uri of uris) {
        const form = new FormData();
        const name = uri.split('/').pop() ?? 'photo.jpg';
        form.append('file', {
          uri,
          name,
          type: 'image/jpeg',
        } as unknown as Blob);
        try {
          await profilesApi.uploadPhoto(form);
        } catch {
          // Backend may not be ready; continue
        }
      }

      if (user) {
        await setUser({ ...user, firstName: draft.firstName, onboardingComplete: true });
      }
      router.replace('/(tabs)/discover');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not save profile';
      // Still allow entry if backend is down after local draft saved
      if (user) {
        await setUser({ ...user, firstName: draft.firstName, onboardingComplete: true });
      }
      Alert.alert('Profile saved locally', `${msg}. You can continue and sync later.`);
      router.replace('/(tabs)/discover');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingShell
      progress={1}
      title="Add your recent pics"
      nextDisabled={!valid}
      nextLoading={loading}
      onNext={finish}
      nextLabel="Next"
    >
      <PhotoGrid
        uris={uris}
        onChange={(next) => {
          setUris(next);
          setOnboarding({ photoUris: next });
        }}
      />
      <View style={styles.counterRow}>
        <View style={styles.counter}>
          <Text style={styles.counterText}>{uris.length} / 6</Text>
        </View>
        <Text style={styles.hint}>
          {uris.length < 2
            ? 'Hey! Let’s add 2 to start. We recommend a face pic.'
            : 'Looking good — you can add more anytime.'}
        </Text>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  counter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  hint: { flex: 1, color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
});
