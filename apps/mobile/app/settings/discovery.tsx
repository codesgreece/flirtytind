import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShowMe } from '@flirty/shared';
import { ChoicePill } from '../../src/components/ChoicePill';
import { usePreferences, useUpdatePreferences } from '../../src/hooks/queries';
import { LoadingState } from '../../src/components/EmptyState';
import { colors } from '../../src/theme/colors';

function Stepper({
  value,
  min,
  max,
  onChange,
  suffix = '',
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <View style={styles.stepRow}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        style={styles.stepBtn}
      >
        <Text style={styles.stepBtnText}>−</Text>
      </Pressable>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${((value - min) / Math.max(max - min, 1)) * 100}%` },
          ]}
        />
      </View>
      <Text style={styles.stepVal}>
        {value}
        {suffix}
      </Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        style={styles.stepBtn}
      >
        <Text style={styles.stepBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

export default function DiscoverySettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const prefs = usePreferences();
  const update = useUpdatePreferences();

  const [maxDistanceKm, setMaxDistanceKm] = useState(50);
  const [expandDistance, setExpandDistance] = useState(true);
  const [showMe, setShowMe] = useState<ShowMe>(ShowMe.EVERYONE);
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(35);
  const [expandAge, setExpandAge] = useState(true);
  const [minPhotos, setMinPhotos] = useState(1);
  const [requireBio, setRequireBio] = useState(false);

  useEffect(() => {
    if (!prefs.data) return;
    setMaxDistanceKm(prefs.data.maxDistanceKm ?? 50);
    setExpandDistance(prefs.data.expandDistance ?? true);
    setShowMe(prefs.data.showMe ?? ShowMe.EVERYONE);
    setMinAge(prefs.data.minAge ?? 18);
    setMaxAge(prefs.data.maxAge ?? 35);
    setExpandAge(prefs.data.expandAge ?? true);
    setMinPhotos(prefs.data.minPhotos ?? 1);
    setRequireBio(prefs.data.requireBio ?? false);
  }, [prefs.data]);

  const save = async () => {
    try {
      await update.mutateAsync({
        maxDistanceKm,
        expandDistance,
        showMe,
        minAge,
        maxAge,
        expandAge,
        minPhotos,
        requireBio,
      });
    } catch {
      /* offline ok */
    }
    router.back();
  };

  if (prefs.isLoading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <LoadingState />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ width: 60 }} />
        <Text style={styles.title}>Discovery settings</Text>
        <Pressable onPress={save}>
          <Text style={styles.done}>Done</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Maximum distance">
          <Text style={styles.value}>{maxDistanceKm} km</Text>
          <Stepper
            value={maxDistanceKm}
            min={1}
            max={160}
            onChange={setMaxDistanceKm}
            suffix=" km"
          />
          <Toggle
            label="Show people further away if I run out"
            value={expandDistance}
            onChange={setExpandDistance}
          />
        </Section>

        <Section title="Interested in">
          <View style={styles.pills}>
            {[ShowMe.WOMEN, ShowMe.MEN, ShowMe.EVERYONE].map((opt) => (
              <ChoicePill
                key={opt}
                label={
                  opt === ShowMe.WOMEN
                    ? 'Women'
                    : opt === ShowMe.MEN
                      ? 'Men'
                      : 'Everyone'
                }
                selected={showMe === opt}
                onPress={() => setShowMe(opt)}
                style={{ flex: 1 }}
              />
            ))}
          </View>
        </Section>

        <Section title="Age range">
          <Text style={styles.value}>
            {minAge} – {maxAge}
          </Text>
          <Text style={styles.hint}>Min age</Text>
          <Stepper value={minAge} min={18} max={maxAge} onChange={setMinAge} />
          <Text style={styles.hint}>Max age</Text>
          <Stepper value={maxAge} min={minAge} max={100} onChange={setMaxAge} />
          <Toggle
            label="Show people slightly outside my preferences if I run out"
            value={expandAge}
            onChange={setExpandAge}
          />
        </Section>

        <Section title="Premium Discovery" badge="PLATINUM">
          <Text style={styles.hint}>Minimum number of photos</Text>
          <Stepper value={minPhotos} min={1} max={6} onChange={setMinPhotos} />
          <Toggle label="Has a bio" value={requireBio} onChange={setRequireBio} />
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  children,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.track, true: colors.toggleOn }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgGray },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  title: { fontSize: 16, fontWeight: '700' },
  done: {
    color: colors.linkBlue,
    fontWeight: '700',
    fontSize: 16,
    width: 60,
    textAlign: 'right',
  },
  content: { padding: 12, gap: 12 },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  badge: {
    backgroundColor: '#1a1a2e',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  value: { fontSize: 16, fontWeight: '600' },
  hint: { fontSize: 13, color: colors.textSecondary },
  pills: { flexDirection: 'row', gap: 8 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  toggleLabel: { flex: 1, fontSize: 14, color: colors.textPrimary },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 20, fontWeight: '600' },
  stepVal: { fontSize: 15, fontWeight: '700', minWidth: 52, textAlign: 'center' },
  track: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.sliderOn,
  },
});
