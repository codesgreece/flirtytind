import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  dark?: boolean;
  onSubmit?: () => void;
  autoFocus?: boolean;
};

export function UnderlineInput({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  dark,
  onSubmit,
  autoFocus,
}: Props) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={dark ? '#888' : colors.textPlaceholder}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      onSubmitEditing={onSubmit}
      autoFocus={autoFocus}
      style={[styles.input, dark && styles.inputDark]}
    />
  );
}

type CheckboxProps = {
  checked: boolean;
  onToggle: () => void;
  label: string;
};

export function CheckboxRow({ checked, onToggle, label }: CheckboxProps) {
  return (
    <Pressable style={styles.checkRow} onPress={onToggle}>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Text style={styles.tick}>✓</Text> : null}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    fontSize: 18,
    paddingVertical: 12,
    color: colors.textPrimary,
  },
  inputDark: {
    borderBottomColor: '#555',
    color: colors.white,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  tick: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  checkLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    flex: 1,
  },
});
