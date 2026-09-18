import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  size?: number;
  color?: string;
  gradient?: boolean;
};

export function FlameIcon({ size = 28, color = colors.white, gradient }: Props) {
  if (gradient) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id="fg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.brandOrange} />
            <Stop offset="1" stopColor={colors.brandMagenta} />
          </LinearGradient>
        </Defs>
        <Path
          d="M12 2C12 2 7 7.5 7 12.5C7 16.5 9.5 19 12 21C14.5 19 17 16.5 17 12.5C17 7.5 12 2 12 2Z"
          fill="url(#fg)"
        />
        <Path
          d="M12 10C12 10 10 12.2 10 14.2C10 15.8 11 16.8 12 17.5C13 16.8 14 15.8 14 14.2C14 12.2 12 10 12 10Z"
          fill={colors.white}
          opacity={0.9}
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C12 2 7 7.5 7 12.5C7 16.5 9.5 19 12 21C14.5 19 17 16.5 17 12.5C17 7.5 12 2 12 2Z"
        fill={color}
      />
      <Path
        d="M12 10C12 10 10 12.2 10 14.2C10 15.8 11 16.8 12 17.5C13 16.8 14 15.8 14 14.2C14 12.2 12 10 12 10Z"
        fill={color === colors.white ? colors.brandMagenta : colors.white}
        opacity={0.85}
      />
    </Svg>
  );
}

type LogoProps = {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  showWordmark?: boolean;
};

export function BrandLogo({
  color = colors.white,
  size = 'md',
  style,
  showWordmark = true,
}: LogoProps) {
  const flameSize = size === 'lg' ? 36 : size === 'sm' ? 22 : 28;
  const fontSize = size === 'lg' ? 30 : size === 'sm' ? 18 : 24;

  return (
    <View style={[styles.row, style]}>
      <FlameIcon size={flameSize} color={color} gradient={color !== colors.white} />
      {showWordmark ? (
        <Text style={[styles.wordmark, { color, fontSize }]}>flirty greece</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordmark: {
    fontWeight: '700',
    letterSpacing: -0.6,
    textTransform: 'lowercase',
  },
});
