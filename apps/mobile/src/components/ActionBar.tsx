import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

type Props = {
  onRewind?: () => void;
  onNope?: () => void;
  onSuperLike?: () => void;
  onLike?: () => void;
  onBoost?: () => void;
  emphasize?: 'like' | 'nope' | 'super' | null;
  compact?: boolean;
};

export function ActionBar({
  onRewind,
  onNope,
  onSuperLike,
  onLike,
  onBoost,
  emphasize,
  compact,
}: Props) {
  if (compact) {
    return (
      <View style={styles.compactRow}>
        <Pressable style={[styles.circle, styles.lg, styles.whiteBorder]} onPress={onNope}>
          <Ionicons name="close" size={32} color={colors.nope} />
        </Pressable>
        <Pressable style={[styles.circle, styles.md, styles.whiteBorder]} onPress={onSuperLike}>
          <Ionicons name="star" size={22} color={colors.superLike} />
        </Pressable>
        <Pressable style={[styles.circle, styles.lg, styles.whiteBorder]} onPress={onLike}>
          <Ionicons name="heart" size={30} color={colors.like} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Pressable style={[styles.circle, styles.sm]} onPress={onRewind}>
        <Ionicons name="refresh" size={22} color={colors.rewind} />
      </Pressable>

      <Pressable
        style={[
          styles.circle,
          styles.lg,
          emphasize === 'nope' && styles.glowNope,
        ]}
        onPress={onNope}
      >
        <Ionicons name="close" size={34} color={colors.nope} />
      </Pressable>

      <Pressable
        style={[styles.circle, styles.md, emphasize === 'super' && styles.glowSuper]}
        onPress={onSuperLike}
      >
        <Ionicons name="star" size={24} color={colors.superLike} />
      </Pressable>

      <Pressable
        style={[styles.circle, styles.lg, emphasize === 'like' && styles.glowLike]}
        onPress={onLike}
      >
        {emphasize === 'like' ? (
          <LinearGradient
            colors={['#7CFF4A', '#2EE66B']}
            style={styles.fillGradient}
          >
            <Ionicons name="heart" size={32} color={colors.white} />
          </LinearGradient>
        ) : (
          <Ionicons name="heart" size={32} color={colors.like} />
        )}
      </Pressable>

      <Pressable style={[styles.circle, styles.sm]} onPress={onBoost}>
        <Ionicons name="flash" size={22} color={colors.boost} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  circle: {
    backgroundColor: colors.white,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    overflow: 'hidden',
  },
  sm: { width: 46, height: 46 },
  md: { width: 52, height: 52 },
  lg: { width: 64, height: 64 },
  whiteBorder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  fillGradient: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowNope: {
    borderWidth: 3,
    borderColor: colors.nope,
  },
  glowLike: {
    borderWidth: 0,
  },
  glowSuper: {
    borderWidth: 3,
    borderColor: colors.superLike,
  },
});
