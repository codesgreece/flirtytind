import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  PlanCode,
  PLAN_PRICES_EUR,
  PLAN_ENTITLEMENTS,
} from '@flirty/shared';
import { BackButton } from '../../src/components/BackButton';
import { PillButton } from '../../src/components/PillButton';
import { useSubscription } from '../../src/hooks/queries';
import { subscriptionsApi } from '../../src/api/endpoints';
import { colors } from '../../src/theme/colors';
import { radii } from '../../src/theme/typography';
import { useState } from 'react';

const PLANS = [PlanCode.FREE, PlanCode.PLUS, PlanCode.GOLD, PlanCode.PLATINUM];

const HIGHLIGHTS: Record<PlanCode, string[]> = {
  [PlanCode.FREE]: ['50 likes / day', '1 Super Like / week', '1 DM / day'],
  [PlanCode.PLUS]: ['Unlimited likes', 'Passport', 'Incognito mode', '5 Super Likes / week'],
  [PlanCode.GOLD]: ['See who likes you', 'Top Picks', '1 Boost / month', '10 DMs / day'],
  [PlanCode.PLATINUM]: [
    'Priority visibility',
    'Message before match',
    'Unlimited DMs',
    '2 Boosts / month',
  ],
};

export default function PremiumScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sub = useSubscription();
  const current = sub.data?.planCode ?? PlanCode.FREE;
  const [selected, setSelected] = useState<PlanCode>(PlanCode.GOLD);
  const [loading, setLoading] = useState(false);

  const purchase = async () => {
    if (selected === PlanCode.FREE) {
      router.back();
      return;
    }
    setLoading(true);
    try {
      await subscriptionsApi.subscribe(selected);
      Alert.alert('Success', `You’re now on ${selected}.`);
      router.back();
    } catch {
      Alert.alert('Purchase pending', 'Billing will confirm when the API is available.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title}>Flirty Greece Premium</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient colors={[...colors.brandGradient]} style={styles.hero}>
          <Text style={styles.heroTitle}>Upgrade your experience</Text>
          <Text style={styles.heroSub}>
            Current plan: {current}
          </Text>
        </LinearGradient>

        {PLANS.map((plan) => {
          const price = PLAN_PRICES_EUR[plan];
          const on = selected === plan;
          const isCurrent = current === plan;
          return (
            <Pressable
              key={plan}
              style={[styles.card, on && styles.cardOn]}
              onPress={() => setSelected(plan)}
            >
              <View style={styles.cardHead}>
                <Text style={styles.planName}>{plan}</Text>
                {isCurrent ? (
                  <View style={styles.current}>
                    <Text style={styles.currentText}>CURRENT</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.price}>
                {price === 0 ? 'Free' : `€${price.toFixed(2)} / mo`}
              </Text>
              {HIGHLIGHTS[plan].map((h) => (
                <Text key={h} style={styles.feature}>
                  • {h}
                </Text>
              ))}
              <Text style={styles.entitlementHint}>
                Likes/day:{' '}
                {PLAN_ENTITLEMENTS[plan].likesPerDay ?? 'Unlimited'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PillButton
          label={
            selected === current
              ? 'Current plan'
              : selected === PlanCode.FREE
                ? 'Continue free'
                : `Get ${selected}`
          }
          onPress={purchase}
          loading={loading}
          disabled={selected === current}
          variant={selected === current ? 'disabled' : 'gradient'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  title: { fontSize: 16, fontWeight: '700' },
  content: { padding: 16, gap: 12 },
  hero: {
    borderRadius: radii.lg,
    padding: 20,
    marginBottom: 4,
  },
  heroTitle: { color: colors.white, fontSize: 22, fontWeight: '700' },
  heroSub: { color: 'rgba(255,255,255,0.9)', marginTop: 6 },
  card: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 16,
  },
  cardOn: {
    borderColor: colors.brandMagenta,
    backgroundColor: '#FFF5F8',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planName: { fontSize: 18, fontWeight: '800', color: colors.black },
  current: {
    backgroundColor: colors.black,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  currentText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  price: { fontSize: 16, fontWeight: '600', marginTop: 4, marginBottom: 8 },
  feature: { color: colors.textPrimary, marginTop: 2, fontSize: 14 },
  entitlementHint: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 12,
  },
  footer: { paddingHorizontal: 16 },
});
