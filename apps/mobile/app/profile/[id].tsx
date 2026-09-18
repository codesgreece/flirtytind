import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SwipeAction, LOOKING_FOR_LABELS, LookingFor } from '@flirty/shared';
import { FlameIcon } from '../../src/components/BrandLogo';
import { ActionBar } from '../../src/components/ActionBar';
import { LoadingState, ErrorState } from '../../src/components/EmptyState';
import { useProfile, useSwipe } from '../../src/hooks/queries';
import { messagesApi, blocksApi, reportsApi } from '../../src/api/endpoints';
import { colors } from '../../src/theme/colors';
import { radii } from '../../src/theme/typography';

export default function ProfileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profileQ = useProfile(id!);
  const swipe = useSwipe();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [dm, setDm] = useState('');

  const p = profileQ.data;
  const photos = p?.photos ?? [];
  const photo = photos[photoIndex]?.url;
  const looking = p?.lookingFor
    ? LOOKING_FOR_LABELS[p.lookingFor as LookingFor]
    : null;

  const doSwipe = async (action: SwipeAction) => {
    if (!p) return;
    try {
      const res = await swipe.mutateAsync({ targetUserId: p.userId, action });
      if (res.matched && res.matchId) {
        router.replace(`/match/${res.matchId}`);
      } else {
        router.back();
      }
    } catch {
      router.back();
    }
  };

  if (profileQ.isLoading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <LoadingState />
      </View>
    );
  }

  if (profileQ.isError || !p) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <ErrorState onRetry={() => profileQ.refetch()} />
      </View>
    );
  }

  const age =
    p.age ??
    (p.birthDate
      ? Math.floor(
          (Date.now() - new Date(p.birthDate).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000),
        )
      : undefined);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Text style={styles.topName}>
          {p.firstName}
          {age ? ` ${age}` : ''}
        </Text>
        <FlameIcon size={24} gradient />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={styles.hero}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.heroImg} />
          ) : (
            <View style={[styles.heroImg, styles.ph]}>
              <Text style={styles.phText}>{p.firstName[0]}</Text>
            </View>
          )}
          <View style={styles.segments}>
            {(photos.length ? photos : [1]).map((_, i) => (
              <View
                key={i}
                style={[styles.seg, i === photoIndex && styles.segOn]}
              />
            ))}
          </View>
          <Pressable style={styles.tapL} onPress={() => setPhotoIndex((i) => Math.max(0, i - 1))} />
          <Pressable
            style={styles.tapR}
            onPress={() =>
              setPhotoIndex((i) => Math.min(Math.max(photos.length - 1, 0), i + 1))
            }
          />
          <Pressable style={styles.menu}>
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.white} />
          </Pressable>
        </View>

        <View style={styles.cards}>
          {looking ? (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Ionicons name="search" size={16} color={colors.textMuted} />
                <Text style={styles.cardHeadText}>Looking for</Text>
              </View>
              <Text style={styles.looking}>
                {looking.emoji} {looking.label}
              </Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Ionicons name="person-circle-outline" size={18} color={colors.textMuted} />
              <Text style={styles.cardTitle}>Essentials</Text>
            </View>
            {p.distanceKm != null ? (
              <Attr icon="location-outline" value={`${p.distanceKm} kilometre away`} />
            ) : null}
            {p.city ? <Attr icon="home-outline" value={p.city} /> : null}
            {p.heightCm ? <Attr icon="resize-outline" value={`${p.heightCm} cm`} /> : null}
          </View>

          {(p.education || p.loveStyle || p.zodiac || p.communicationStyle) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Basics</Text>
              {p.education ? <Attr icon="school-outline" label="Education" value={p.education} /> : null}
              {p.loveStyle ? <Attr icon="heart-outline" label="Love style" value={p.loveStyle} /> : null}
              {p.zodiac ? <Attr icon="moon-outline" label="Zodiac" value={p.zodiac} /> : null}
              {p.communicationStyle ? (
                <Attr icon="chatbubble-outline" label="Communication" value={p.communicationStyle} />
              ) : null}
            </View>
          )}

          {(p.workout || p.smoking || p.drinking || p.pets) && (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Ionicons name="file-tray-full-outline" size={18} color={colors.textMuted} />
                <Text style={styles.cardTitle}>Lifestyle</Text>
              </View>
              {p.workout ? <Attr icon="barbell-outline" label="Workout" value={p.workout} /> : null}
              {p.smoking ? (
                <Attr icon="cloud-outline" label="How often do you smoke?" value={p.smoking} />
              ) : null}
              {p.drinking ? <Attr icon="wine-outline" label="Drinking" value={p.drinking} /> : null}
              {p.pets ? <Attr icon="paw-outline" label="Pets" value={p.pets} /> : null}
            </View>
          )}

          {(p.interests?.length ?? 0) > 0 ? (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Ionicons name="people-outline" size={18} color={colors.textMuted} />
                <Text style={styles.cardTitle}>Interests</Text>
              </View>
              <View style={styles.pills}>
                {p.interests!.map((i) => (
                  <View key={i.id} style={styles.pill}>
                    <Text style={styles.pillText}>{i.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.card}>
            <View style={styles.dmHead}>
              <Ionicons name="chatbubble-ellipses" size={20} color={colors.linkBlue} />
              <Text style={styles.dmTitle}>Send {p.firstName} a message</Text>
            </View>
            <Text style={styles.dmSub}>
              Increase your chances of getting a match by up to 25%
            </Text>
            <TextInput
              style={styles.dmInput}
              placeholder="Type a message"
              placeholderTextColor={colors.textPlaceholder}
              value={dm}
              onChangeText={setDm}
              onSubmitEditing={async () => {
                if (!dm.trim()) return;
                try {
                  await messagesApi.direct(p.userId, dm.trim());
                  setDm('');
                  Alert.alert('Sent', 'Your message was sent.');
                } catch (e) {
                  Alert.alert('Unable to send', 'Direct messages may require Premium.');
                }
              }}
            />
          </View>

          <Pressable style={styles.actionRow}>
            <Text style={styles.actionLabel}>Share {p.firstName}’s profile</Text>
          </Pressable>
          <Pressable
            style={styles.actionRow}
            onPress={async () => {
              await blocksApi.create(p.userId).catch(() => undefined);
              Alert.alert('Blocked', `${p.firstName} has been blocked.`);
              router.back();
            }}
          >
            <Text style={styles.actionLabel}>Block {p.firstName}</Text>
          </Pressable>
          <Pressable
            style={styles.actionRow}
            onPress={async () => {
              await reportsApi
                .create(p.userId, 'inappropriate')
                .catch(() => undefined);
              Alert.alert('Reported', 'Thanks for helping keep Flirty Greece safe.');
            }}
          >
            <Text style={[styles.actionLabel, { color: colors.report }]}>
              Report {p.firstName}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.fab, { bottom: insets.bottom + 16 }]}>
        <ActionBar
          compact
          onNope={() => doSwipe(SwipeAction.PASS)}
          onSuperLike={() => doSwipe(SwipeAction.SUPER_LIKE)}
          onLike={() => doSwipe(SwipeAction.LIKE)}
        />
      </View>
    </View>
  );
}

function Attr({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  value: string;
}) {
  return (
    <View style={styles.attr}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <View style={{ flex: 1 }}>
        {label ? <Text style={styles.attrLabel}>{label}</Text> : null}
        <Text style={styles.attrValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgLavender },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  topName: { fontSize: 26, fontWeight: '700', color: colors.black },
  hero: {
    marginHorizontal: 12,
    borderRadius: radii.xl,
    overflow: 'hidden',
    height: 420,
    backgroundColor: colors.charcoal,
  },
  heroImg: { width: '100%', height: '100%' },
  ph: { alignItems: 'center', justifyContent: 'center' },
  phText: { fontSize: 64, fontWeight: '700', color: colors.white },
  segments: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    gap: 4,
  },
  seg: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  segOn: { backgroundColor: colors.white },
  tapL: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '35%' },
  tapR: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '35%' },
  menu: { position: 'absolute', top: 16, right: 12 },
  cards: { padding: 12, gap: 12 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 16,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardHeadText: { color: colors.textMuted, fontSize: 13 },
  cardTitle: { fontWeight: '700', fontSize: 16, color: colors.black },
  looking: { fontSize: 18, fontWeight: '700', color: colors.black },
  attr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  attrLabel: { fontSize: 12, color: colors.textMuted },
  attrValue: { fontSize: 15, color: colors.textPrimary },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  pill: {
    backgroundColor: colors.bgGray,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillText: { color: colors.textPrimary, fontSize: 13 },
  dmHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dmTitle: { fontWeight: '700', fontSize: 16 },
  dmSub: { color: colors.textSecondary, fontSize: 13, marginTop: 6, marginBottom: 12 },
  dmInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  actionRow: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 16,
  },
  actionLabel: { textAlign: 'center', fontWeight: '600', fontSize: 15 },
  fab: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
