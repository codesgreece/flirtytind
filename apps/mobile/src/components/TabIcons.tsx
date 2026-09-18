import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { FlameIcon } from './BrandLogo';
import { colors } from '../theme/colors';

type TabIconProps = {
  focused: boolean;
  color: string;
  size?: number;
  badge?: number;
};

export function DiscoverTabIcon({ focused, size = 28 }: TabIconProps) {
  if (focused) {
    return <FlameIcon size={size} gradient />;
  }
  return <FlameIcon size={size} color={colors.tabInactive} />;
}

export function ExploreTabIcon({ focused, color, size = 26 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth={2} />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth={2} />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth={2} />
      <Circle cx="17.5" cy="17.5" r="3.5" stroke={color} strokeWidth={2} />
      <Path d="M20 20L22 22" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function LikesTabIcon({ focused, color, size = 26, badge }: TabIconProps) {
  return (
    <View>
      <Ionicons
        name={focused ? 'sparkles' : 'sparkles-outline'}
        size={size}
        color={color}
      />
      {badge && badge > 0 ? (
        <View style={styles.badge}>
          <Ionicons name="ellipse" size={18} color="#333" style={{ position: 'absolute' }} />
          <View style={styles.badgeInner}>
            {/* numeric badge rendered by parent typically */}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function MessagesTabIcon({ focused, size = 26 }: TabIconProps) {
  if (focused) {
    return (
      <View style={styles.msgWrap}>
        <LinearGradient
          colors={[...colors.brandGradient]}
          style={styles.msgGrad}
        >
          <Ionicons name="chatbubbles" size={size - 4} color={colors.white} />
        </LinearGradient>
      </View>
    );
  }
  return <Ionicons name="chatbubbles-outline" size={size} color={colors.tabInactive} />;
}

export function ProfileTabIcon({ focused, color, size = 26 }: TabIconProps) {
  return (
    <Ionicons
      name={focused ? 'person' : 'person-outline'}
      size={size}
      color={color}
    />
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInner: {},
  msgWrap: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  msgGrad: {
    width: 30,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
