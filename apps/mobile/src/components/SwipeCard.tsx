import { useCallback, useImperativeHandle, forwardRef } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Image, Pressable } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SwipeAction, LOOKING_FOR_LABELS, LookingFor } from '@flirty/shared';
import type { DiscoverProfile } from '../api/endpoints';
import { colors } from '../theme/colors';
import { radii, typography } from '../theme/typography';

const SPRING = { damping: 16, stiffness: 200, mass: 0.85 };

export type SwipeCardHandle = {
  swipe: (action: SwipeAction) => void;
};

type Props = {
  profile: DiscoverProfile;
  onSwipe: (action: SwipeAction) => void;
  onOpenProfile?: () => void;
  photoIndex?: number;
  onPhotoIndexChange?: (index: number) => void;
  isTop?: boolean;
  /** 0..1 drag progress shared with underlay card for scale peek */
  dragProgress?: SharedValue<number>;
};

function formatHeight(cm?: number | null) {
  if (!cm) return null;
  const totalIn = Math.round(cm / 2.54);
  const ft = Math.floor(totalIn / 12);
  const inches = totalIn % 12;
  return `${ft} ft ${inches} in`;
}

export const SwipeCard = forwardRef<SwipeCardHandle, Props>(function SwipeCard(
  {
    profile,
    onSwipe,
    onOpenProfile,
    photoIndex = 0,
    onPhotoIndexChange,
    isTop = true,
    dragProgress,
  },
  ref,
) {
  const { width: windowW } = useWindowDimensions();
  const screenW = Math.min(windowW, 430);
  const swipeX = screenW * 0.28;
  const swipeY = -120;

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const exiting = useSharedValue(0);

  const photos = profile.photos ?? [];
  const photoCount = Math.max(photos.length, 1);
  const safeIndex = Math.min(photoIndex, photoCount - 1);
  const uri = photos[safeIndex]?.url;

  const age =
    profile.age ??
    (profile.birthDate
      ? Math.floor(
          (Date.now() - new Date(profile.birthDate).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000),
        )
      : undefined);

  const finish = useCallback(
    (action: SwipeAction) => {
      onSwipe(action);
    },
    [onSwipe],
  );

  const flyOut = useCallback(
    (action: SwipeAction) => {
      const toX =
        action === SwipeAction.PASS
          ? -screenW * 1.5
          : action === SwipeAction.LIKE
            ? screenW * 1.5
            : 0;
      const toY =
        action === SwipeAction.SUPER_LIKE
          ? -screenW * 1.6
          : action === SwipeAction.LIKE || action === SwipeAction.PASS
            ? 48
            : 0;
      exiting.value = 1;
      if (dragProgress) dragProgress.value = withTiming(1, { duration: 220 });
      tx.value = withTiming(toX, { duration: 280 });
      ty.value = withTiming(toY, { duration: 280 }, () => {
        runOnJS(finish)(action);
      });
    },
    [dragProgress, exiting, finish, tx, ty],
  );

  useImperativeHandle(ref, () => ({
    swipe: (action: SwipeAction) => flyOut(action),
  }));

  const pan = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
      const px = Math.abs(e.translationX) / swipeX;
      const py = Math.abs(Math.min(e.translationY, 0)) / Math.abs(swipeY);
      const p = Math.min(1, Math.max(px, py));
      if (dragProgress) dragProgress.value = p;
    })
    .onEnd((e) => {
      if (e.translationY < swipeY && Math.abs(e.translationX) < swipeX) {
        runOnJS(flyOut)(SwipeAction.SUPER_LIKE);
        return;
      }
      if (e.translationX > swipeX) {
        runOnJS(flyOut)(SwipeAction.LIKE);
        return;
      }
      if (e.translationX < -swipeX) {
        runOnJS(flyOut)(SwipeAction.PASS);
        return;
      }
      // Spring cancel back to center
      tx.value = withSpring(0, SPRING);
      ty.value = withSpring(0, SPRING);
      if (dragProgress) {
        dragProgress.value = withSpring(0, SPRING);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      tx.value,
      [-screenW, 0, screenW],
      [-18, 0, 18],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: tx.value },
        { translateY: ty.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const likeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(tx.value, [16, swipeX], [0, 1], Extrapolation.CLAMP);
    const scale = interpolate(tx.value, [16, swipeX], [0.7, 1], Extrapolation.CLAMP);
    const rotate = interpolate(tx.value, [0, swipeX], [-28, -18], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ scale }, { rotate: `${rotate}deg` }],
    };
  });

  const nopeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(tx.value, [-16, -swipeX], [0, 1], Extrapolation.CLAMP);
    const scale = interpolate(tx.value, [-16, -swipeX], [0.7, 1], Extrapolation.CLAMP);
    const rotate = interpolate(tx.value, [0, -swipeX], [28, 18], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ scale }, { rotate: `${rotate}deg` }],
    };
  });

  const superStyle = useAnimatedStyle(() => {
    const opacity = interpolate(ty.value, [-16, swipeY], [0, 1], Extrapolation.CLAMP);
    const scale = interpolate(ty.value, [-16, swipeY], [0.75, 1], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ scale }, { rotate: '-8deg' }],
    };
  });

  const tapPhoto = (side: 'left' | 'right') => {
    if (!onPhotoIndexChange || photos.length <= 1) return;
    if (side === 'right') {
      onPhotoIndexChange(Math.min(safeIndex + 1, photos.length - 1));
    } else {
      onPhotoIndexChange(Math.max(safeIndex - 1, 0));
    }
  };

  const looking = profile.lookingFor
    ? LOOKING_FOR_LABELS[profile.lookingFor as LookingFor]
    : null;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, cardStyle]}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>{profile.firstName?.[0] ?? '?'}</Text>
          </View>
        )}

        <View style={styles.segments}>
          {Array.from({ length: photoCount }).map((_, i) => (
            <View
              key={i}
              style={[styles.segment, i === safeIndex && styles.segmentActive]}
            />
          ))}
        </View>

        <Pressable style={styles.tapLeft} onPress={() => tapPhoto('left')} />
        <Pressable style={styles.tapRight} onPress={() => tapPhoto('right')} />

        <Animated.View style={[styles.stamp, styles.likeStamp, likeStyle]}>
          <Text style={styles.likeStampText}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.nopeStamp, nopeStyle]}>
          <Text style={styles.nopeStampText}>NOPE</Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.superStamp, superStyle]}>
          <Text style={styles.superStampText}>SUPER LIKE</Text>
        </Animated.View>

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.82)']}
          locations={[0, 0.45, 1]}
          style={styles.bottomFade}
        >
          <View style={styles.badges}>
            {profile.isNearby ? (
              <View style={[styles.badge, { backgroundColor: colors.nearby }]}>
                <Text style={styles.badgeText}>Nearby</Text>
              </View>
            ) : null}
            {profile.isActive ? (
              <View style={[styles.badge, { backgroundColor: colors.active }]}>
                <Text style={styles.badgeText}>Active</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.infoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {profile.firstName}
                {age ? <Text style={styles.age}> {age}</Text> : null}
              </Text>
              <View style={styles.metaRow}>
                {profile.distanceKm != null ? (
                  <Text style={styles.meta}>
                    <Ionicons name="location-outline" size={14} color={colors.white} />{' '}
                    {profile.distanceKm} km away
                  </Text>
                ) : null}
                {profile.city ? (
                  <Text style={styles.meta}>
                    <Ionicons name="home-outline" size={14} color={colors.white} /> {profile.city}
                  </Text>
                ) : null}
                {formatHeight(profile.heightCm) ? (
                  <Text style={styles.meta}>
                    <Ionicons name="resize-outline" size={14} color={colors.white} />{' '}
                    {formatHeight(profile.heightCm)}
                  </Text>
                ) : null}
              </View>
              {looking ? (
                <Text style={styles.looking}>
                  {looking.emoji} {looking.label}
                </Text>
              ) : null}
            </View>
            <Pressable style={styles.openBtn} onPress={onOpenProfile}>
              <Ionicons name="chevron-up" size={20} color={colors.white} />
            </Pressable>
          </View>
        </LinearGradient>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  card: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.card,
    overflow: 'hidden',
    backgroundColor: colors.charcoal,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
  },
  placeholderText: {
    color: colors.white,
    fontSize: 64,
    fontWeight: '700',
  },
  segments: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    gap: 4,
    zIndex: 5,
  },
  segment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  segmentActive: {
    backgroundColor: colors.white,
  },
  tapLeft: {
    position: 'absolute',
    left: 0,
    top: 40,
    bottom: 120,
    width: '30%',
    zIndex: 4,
  },
  tapRight: {
    position: 'absolute',
    right: 0,
    top: 40,
    bottom: 120,
    width: '30%',
    zIndex: 4,
  },
  stamp: {
    position: 'absolute',
    top: 48,
    zIndex: 6,
    borderWidth: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  likeStamp: {
    left: 18,
    borderColor: colors.like,
  },
  nopeStamp: {
    right: 18,
    borderColor: colors.nope,
  },
  superStamp: {
    alignSelf: 'center',
    left: '18%',
    right: '18%',
    top: 56,
    borderColor: colors.superLike,
  },
  likeStampText: {
    ...typography.stamp,
    color: colors.like,
    fontSize: 40,
  },
  nopeStampText: {
    ...typography.stamp,
    color: colors.nope,
    fontSize: 40,
  },
  superStampText: {
    ...typography.stamp,
    color: colors.superLike,
    fontSize: 28,
    letterSpacing: 1,
    textAlign: 'center',
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 72,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  name: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  age: {
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  meta: {
    color: colors.white,
    fontSize: 13,
    opacity: 0.95,
  },
  looking: {
    color: colors.white,
    fontSize: 14,
    marginTop: 6,
    fontWeight: '600',
  },
  openBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
