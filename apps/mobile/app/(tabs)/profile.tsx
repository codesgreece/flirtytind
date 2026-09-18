import { View, Text, StyleSheet, Pressable, Image, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMe, useSubscription } from '../../src/hooks/queries';
import { EmptyState, LoadingState } from '../../src/components/EmptyState';
import { BrandLogo } from '../../src/components/BrandLogo';
import { useAuthStore } from '../../src/store/auth';
import { colors } from '../../src/theme/colors';
import { radii } from '../../src/theme/typography';

export default function ProfileTabScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const me = useMe();
  const sub = useSubscription();
  const clear = useAuthStore((s) => s.clear);

  const profile = me.data;
  const photo = profile?.photos?.[0]?.url;
  const age = profile?.age;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <BrandLogo size="sm" color={colors.brandMagenta} />
        <Pressable onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {me.isLoading ? (
        <LoadingState />
      ) : !profile ? (
        <EmptyState
          title="Complete your profile"
          subtitle="Add photos and details so people can find you."
          actionLabel="Edit profile"
          onAction={() => router.push('/(onboarding)/name')}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable style={styles.photoWrap}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.ph]}>
                <Text style={styles.phText}>{profile.firstName?.[0]}</Text>
              </View>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.fade}
            >
              <Text style={styles.name}>
                {profile.firstName}
                {age ? `, ${age}` : ''}
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.planCard} onPress={() => router.push('/settings/premium')}>
            <Text style={styles.planLabel}>
              Current plan · {sub.data?.planCode ?? 'FREE'}
            </Text>
            <Text style={styles.planCta}>Upgrade</Text>
          </Pressable>

          <Row
            icon="options-outline"
            label="Discovery settings"
            onPress={() => router.push('/settings/discovery')}
          />
          <Row
            icon="diamond-outline"
            label="Flirty Greece Premium"
            onPress={() => router.push('/settings/premium')}
          />
          <Row
            icon="log-out-outline"
            label="Sign out"
            danger
            onPress={() => {
              Alert.alert('Sign out?', undefined, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Sign out',
                  style: 'destructive',
                  onPress: async () => {
                    await clear();
                    router.replace('/(auth)/welcome');
                  },
                },
              ]);
            }}
          />
        </ScrollView>
      )}
    </View>
  );
}

function Row({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Ionicons
        name={icon}
        size={22}
        color={danger ? colors.report : colors.textPrimary}
      />
      <Text style={[styles.rowLabel, danger && { color: colors.report }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  content: { padding: 16, gap: 12 },
  photoWrap: {
    alignSelf: 'center',
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  ph: {
    backgroundColor: colors.bgGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phText: { fontSize: 48, fontWeight: '700', color: colors.textMuted },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    alignItems: 'center',
  },
  name: { color: colors.white, fontWeight: '700', fontSize: 18 },
  planCard: {
    marginTop: 8,
    borderRadius: radii.lg,
    backgroundColor: colors.bgLavender,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLabel: { fontWeight: '600', color: colors.textPrimary },
  planCta: { color: colors.linkBlue, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '500' },
});
