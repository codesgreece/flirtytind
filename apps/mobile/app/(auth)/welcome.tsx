import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BrandLogo } from '../../src/components/BrandLogo';
import { PillButton } from '../../src/components/PillButton';
import { colors } from '../../src/theme/colors';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Animated.View entering={FadeInDown.duration(500)} style={styles.logoArea}>
          <BrandLogo color={colors.white} size="lg" />
          <Text style={styles.tagline}>It starts with a Swipe™</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.bottom}>
          <Text style={styles.legal}>
            By tapping Create account or Sign in, you agree to our{' '}
            <Text style={styles.link}>Terms</Text>. Learn how we process your data in our{' '}
            <Text style={styles.link}>Privacy Policy</Text> and{' '}
            <Text style={styles.link}>Cookies Policy</Text>.
          </Text>

          <PillButton
            label="Create account"
            variant="white"
            onPress={() => router.push('/(auth)/register')}
            style={styles.btn}
            textStyle={styles.btnText}
          />
          <PillButton
            label="Sign in"
            variant="white"
            onPress={() => router.push('/(auth)/login')}
            style={styles.btn}
            textStyle={styles.btnText}
          />

          <Pressable onPress={() => router.push('/(auth)/login')} style={styles.trouble}>
            <Text style={styles.troubleText}>Trouble signing in?</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  logoArea: {
    alignItems: 'center',
    marginTop: 80,
    gap: 16,
  },
  tagline: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  bottom: {
    gap: 12,
  },
  legal: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  link: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  btn: {
    backgroundColor: colors.white,
  },
  btnText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  trouble: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  troubleText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
