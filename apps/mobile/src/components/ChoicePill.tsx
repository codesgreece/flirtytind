import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { radii } from '../theme/typography';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  emoji?: string;
};

export function ChoicePill({ label, selected, onPress, style, emoji }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, selected && styles.selected, style]}
    >
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  selected: {
    borderColor: colors.black,
    backgroundColor: colors.bgGray,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  labelSelected: {
    color: colors.black,
  },
  emoji: {
    fontSize: 18,
  },
});
