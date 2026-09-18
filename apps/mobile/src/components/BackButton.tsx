import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type Props = {
  onPress?: () => void;
  color?: string;
  style?: ViewStyle;
};

export function BackButton({ onPress, color = colors.black, style }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.btn, style]} hitSlop={12}>
      <Ionicons name="chevron-back" size={28} color={color} />
    </Pressable>
  );
}

export function SkipButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={12}>
      <Text style={styles.skip}>Skip</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  skip: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
