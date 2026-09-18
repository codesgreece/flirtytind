import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

type Props = {
  progress: number; // 0..1
};

export function ProgressBar({ progress }: Props) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <View style={styles.track}>
      <LinearGradient
        colors={[...colors.progressGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.fill, { width: `${pct}%` }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    width: '100%',
    backgroundColor: colors.track,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
