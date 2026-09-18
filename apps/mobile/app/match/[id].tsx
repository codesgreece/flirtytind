import { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { matchesApi } from '../../src/api/endpoints';
import { PillButton } from '../../src/components/PillButton';
import { BrandLogo } from '../../src/components/BrandLogo';
import { useMe } from '../../src/hooks/queries';
import { colors } from '../../src/theme/colors';

export default function MatchCelebrationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const me = useMe();
  const match = useQuery({
    queryKey: ['match', id],
    queryFn: () => matchesApi.get(id!),
    enabled: !!id,
  });

  const other = match.data?.otherUser;
  const myPhoto = me.data?.photos?.[0]?.url;
  const theirPhoto = other?.photos?.[0]?.url;
  const conversationId = match.data?.conversationId;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
        <BrandLogo color={colors.white} size="md" />
        <Text style={styles.title}>It’s a Match!</Text>
        <Text style={styles.sub}>
          You and {other?.firstName ?? 'they'} liked each other
        </Text>

        <View style={styles.avatars}>
          <PopAvatar uri={myPhoto} name={me.data?.firstName} delay={80} />
          <PopAvatar uri={theirPhoto} name={other?.firstName} delay={220} />
        </View>

        <View style={styles.actions}>
          <PillButton
            label="Send a message"
            variant="white"
            onPress={() => {
              if (conversationId) {
                router.replace(`/chat/${conversationId}`);
              } else {
                router.replace('/(tabs)/messages');
              }
            }}
          />
          <Pressable onPress={() => router.replace('/(tabs)/discover')}>
            <Text style={styles.keep}>Keep swiping</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

function PopAvatar({
  uri,
  name,
  delay,
}: {
  uri?: string;
  name?: string;
  delay: number;
}) {
  const scale = useSharedValue(0.2);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1.12, { damping: 10, stiffness: 180 }),
        withSpring(1, { damping: 12, stiffness: 160 }),
      ),
    );
  }, [delay, opacity, scale]);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.avatarWrap, anim]}>
      {uri ? (
        <Image source={{ uri }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.ph]}>
          <Text style={styles.phText}>{name?.[0] ?? '?'}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 12,
  },
  title: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '800',
    marginTop: 24,
  },
  sub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    textAlign: 'center',
  },
  avatars: {
    flexDirection: 'row',
    gap: 20,
    marginVertical: 32,
  },
  avatarWrap: {
    borderWidth: 3,
    borderColor: colors.white,
    borderRadius: 70,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  ph: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phText: { color: colors.white, fontSize: 40, fontWeight: '700' },
  actions: { width: '100%', gap: 16 },
  keep: {
    color: colors.white,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
    paddingVertical: 8,
  },
});
