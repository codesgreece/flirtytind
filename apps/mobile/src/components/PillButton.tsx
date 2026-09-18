import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { radii } from '../theme/typography';

type Variant = 'primary' | 'gradient' | 'outline' | 'white' | 'blue' | 'disabled';

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function PillButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
  textStyle,
}: Props) {
  const isDisabled = disabled || loading;
  const effective: Variant = isDisabled && variant !== 'outline' ? 'disabled' : variant;

  if (effective === 'gradient') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.base, style, isDisabled && styles.dim]}
      >
        <LinearGradient
          colors={[...colors.brandGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientInner}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={[styles.textWhite, textStyle]}>{label}</Text>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  const bg =
    effective === 'disabled'
      ? colors.disabledBg
      : effective === 'white'
        ? colors.white
        : effective === 'blue'
          ? colors.linkBlue
          : effective === 'outline'
            ? 'transparent'
            : colors.black;

  const textColor =
    effective === 'disabled'
      ? colors.disabledText
      : effective === 'white' || effective === 'outline'
        ? colors.black
        : colors.white;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        styles.solid,
        { backgroundColor: bg },
        effective === 'outline' && styles.outline,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }, textStyle]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    overflow: 'hidden',
    minHeight: 56,
    justifyContent: 'center',
  },
  solid: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  gradientInner: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderRadius: radii.pill,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.black,
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
  textWhite: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  dim: {
    opacity: 0.6,
  },
});
