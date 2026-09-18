import { ReactNode } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProgressBar } from '../../src/components/ProgressBar';
import { BackButton, SkipButton } from '../../src/components/BackButton';
import { PillButton } from '../../src/components/PillButton';
import { colors } from '../../src/theme/colors';

type Props = {
  progress: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
  hideNext?: boolean;
  footer?: ReactNode;
};

export function OnboardingShell({
  progress,
  title,
  subtitle,
  children,
  onNext,
  nextLabel = 'Next',
  nextDisabled,
  nextLoading,
  showSkip,
  onSkip,
  hideNext,
  footer,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + 8 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.progressWrap}>
        <ProgressBar progress={progress} />
      </View>
      <View style={styles.nav}>
        <BackButton onPress={() => router.back()} />
        {showSkip ? <SkipButton onPress={onSkip} /> : <View style={{ width: 40 }} />}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.body}>{children}</View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {footer}
        {!hideNext ? (
          <PillButton
            label={nextLabel}
            onPress={onNext}
            disabled={nextDisabled}
            loading={nextLoading}
            variant={nextDisabled ? 'disabled' : 'primary'}
          />
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  progressWrap: { paddingHorizontal: 16 },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 22,
  },
  body: { flex: 1, marginTop: 20 },
  footer: {
    paddingHorizontal: 20,
    gap: 16,
  },
});
