import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { BrandLogo } from '../src/components/BrandLogo';
import { colors } from '../src/theme/colors';
import { useAuthStore } from '../src/store/auth';

export default function SplashScreen() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    scale.value = withSequence(
      withTiming(1.05, { duration: 400 }),
      withTiming(1, { duration: 250 }),
    );
  }, [opacity, scale]);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      if (!accessToken) {
        router.replace('/(auth)/welcome');
      } else if (user?.onboardingComplete === false) {
        router.replace('/(onboarding)/name');
      } else {
        router.replace('/(tabs)/discover');
      }
    }, 1400);
    return () => clearTimeout(t);
  }, [hydrated, accessToken, user, router]);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <Animated.View style={anim}>
        <BrandLogo color={colors.white} size="lg" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
