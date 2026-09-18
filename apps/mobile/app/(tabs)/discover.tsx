import { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { SwipeAction } from '@flirty/shared';
import { BrandLogo } from '../../src/components/BrandLogo';
import { SwipeCard, type SwipeCardHandle } from '../../src/components/SwipeCard';
import { ActionBar } from '../../src/components/ActionBar';
import { EmptyState, LoadingState, ErrorState } from '../../src/components/EmptyState';
import { useDiscover, useSwipe } from '../../src/hooks/queries';
import { swipesApi, type DiscoverProfile } from '../../src/api/endpoints';
import { useUiStore } from '../../src/store/ui';
import { colors } from '../../src/theme/colors';
import { radii } from '../../src/theme/typography';

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const discover = useDiscover();
  const swipeMutation = useSwipe();
  const setLastSwipeId = useUiStore((s) => s.setLastSwipeId);
  const [deck, setDeck] = useState<DiscoverProfile[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [emphasize, setEmphasize] = useState<'like' | 'nope' | 'super' | null>(null);
  const topRef = useRef<SwipeCardHandle>(null);
  const seeded = useRef(false);
  const dragProgress = useSharedValue(0);

  useEffect(() => {
    if (discover.data && (!seeded.current || deck.length === 0)) {
      setDeck(discover.data);
      seeded.current = true;
    }
  }, [discover.data, deck.length]);

  const top = deck[0];
  const next = deck[1];

  const removeTop = useCallback(() => {
    setDeck((prev) => prev.slice(1));
    setPhotoIndex(0);
    setEmphasize(null);
    dragProgress.value = 0;
  }, [dragProgress]);

  const handleSwipe = useCallback(
    async (action: SwipeAction) => {
      if (!top) return;
      const target = top;
      setLastSwipeId(target.userId);
      removeTop();
      try {
        const res = await swipeMutation.mutateAsync({
          targetUserId: target.userId,
          action,
        });
        if (res.matched && res.matchId) {
          router.push(`/match/${res.matchId}`);
        }
      } catch {
        // UI already advanced; backend may be offline during scaffolding
      }
    },
    [top, removeTop, swipeMutation, setLastSwipeId, router],
  );

  const trigger = (action: SwipeAction) => {
    if (action === SwipeAction.LIKE) setEmphasize('like');
    if (action === SwipeAction.PASS) setEmphasize('nope');
    if (action === SwipeAction.SUPER_LIKE) setEmphasize('super');
    topRef.current?.swipe(action);
  };

  const underlayStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      dragProgress.value,
      [0, 1],
      [0.94, 1],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      dragProgress.value,
      [0, 1],
      [0.92, 1],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <BrandLogo size="sm" color={colors.brandMagenta} />
        <View style={styles.headerActions}>
          <Pressable hitSlop={10}>
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          </Pressable>
          <Pressable hitSlop={10} onPress={() => router.push('/settings/discovery')}>
            <Ionicons name="options-outline" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.stack}>
        {discover.isLoading && deck.length === 0 ? (
          <LoadingState label="Finding people near you…" />
        ) : discover.isError && deck.length === 0 ? (
          <ErrorState
            message="Could not load profiles."
            onRetry={() => {
              seeded.current = false;
              discover.refetch();
            }}
          />
        ) : !top ? (
          <EmptyState
            title="You’re out of profiles"
            subtitle="Expand your discovery settings to see more people."
            actionLabel="Discovery settings"
            onAction={() => router.push('/settings/discovery')}
          />
        ) : (
          <>
            {next ? (
              <Animated.View style={[styles.cardLayer, underlayStyle]} pointerEvents="none">
                <SwipeCard profile={next} onSwipe={() => undefined} isTop={false} />
              </Animated.View>
            ) : null}
            <View style={styles.cardLayer}>
              <SwipeCard
                key={top.userId}
                ref={topRef}
                profile={top}
                onSwipe={handleSwipe}
                onOpenProfile={() => router.push(`/profile/${top.userId}`)}
                photoIndex={photoIndex}
                onPhotoIndexChange={setPhotoIndex}
                isTop
                dragProgress={dragProgress}
              />
            </View>
          </>
        )}
      </View>

      {top ? (
        <ActionBar
          emphasize={emphasize}
          onRewind={async () => {
            try {
              await swipesApi.rewind();
              seeded.current = false;
              await discover.refetch();
            } catch {
              /* entitlement gated */
            }
          }}
          onNope={() => trigger(SwipeAction.PASS)}
          onSuperLike={() => trigger(SwipeAction.SUPER_LIKE)}
          onLike={() => trigger(SwipeAction.LIKE)}
          onBoost={() => router.push('/settings/premium')}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgLavenderAlt },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerActions: { flexDirection: 'row', gap: 18 },
  stack: {
    flex: 1,
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: radii.card,
  },
  cardLayer: {
    ...StyleSheet.absoluteFillObject,
  },
});
