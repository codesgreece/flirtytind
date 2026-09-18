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
        <Pressable
          style={[styles.circle, styles.lg, { borderWidth: 3, borderColor: colors.nope }]}
          onPress={onNope}
        >
          <Ionicons name="close" size={32} color={colors.nope} />
        </Pressable>
        <Pressable
          style={[styles.circle, styles.md, { borderWidth: 2.5, borderColor: colors.superLike }]}
          onPress={onSuperLike}
        >
          <Ionicons name="star" size={22} color={colors.superLike} />
        </Pressable>
        <Pressable
          style={[styles.circle, styles.lg, { borderWidth: 3, borderColor: colors.like }]}
          onPress={onLike}
        >
          <Ionicons name="heart" size={30} color={colors.like} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.circle, styles.sm, { borderWidth: 2, borderColor: colors.rewind }]}
        onPress={onRewind}
      >
        <Ionicons name="refresh" size={22} color={colors.rewind} />
      </Pressable>

      <Pressable
        style={[
          styles.circle,
          styles.lg,
          emphasize === 'nope'
            ? styles.fillNope
            : { borderWidth: 2.5, borderColor: colors.nope },
        ]}
        onPress={onNope}
      >
        <Ionicons
          name="close"
          size={34}
          color={emphasize === 'nope' ? colors.white : colors.nope}
        />
      </Pressable>

      <Pressable
        style={[
          styles.circle,
          styles.md,
          emphasize === 'super'
            ? styles.fillSuper
            : { borderWidth: 2.5, borderColor: colors.superLike },
        ]}
        onPress={onSuperLike}
      >
        <Ionicons
          name="star"
          size={24}
          color={emphasize === 'super' ? colors.white : colors.superLike}
        />
      </Pressable>

      <Pressable
        style={[
          styles.circle,
          styles.lg,
          emphasize === 'like' ? styles.glowLike : { borderWidth: 2.5, borderColor: colors.like },
        ]}
        onPress={onLike}
      >
        {emphasize === 'like' ? (
          <LinearGradient colors={['#7CFF4A', '#2EE66B']} style={styles.fillGradient}>
            <Ionicons name="heart" size={32} color={colors.white} />
          </LinearGradient>
        ) : (
          <Ionicons name="heart" size={32} color={colors.like} />
        )}
      </Pressable>

      <Pressable
        style={[styles.circle, styles.sm, { borderWidth: 2, borderColor: colors.boost }]}
        onPress={onBoost}
      >
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
    paddingVertical: 10,
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
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    overflow: 'hidden',
  },
  sm: { width: 46, height: 46 },
  md: { width: 54, height: 54 },
  lg: { width: 64, height: 64 },
  fillGradient: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fillNope: {
    backgroundColor: colors.nope,
    borderWidth: 0,
  },
  fillSuper: {
    backgroundColor: colors.superLike,
    borderWidth: 0,
  },
  glowLike: {
    borderWidth: 0,
  },
});
