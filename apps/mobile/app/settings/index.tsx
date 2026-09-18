import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '../../src/components/BackButton';
import { useAuthStore } from '../../src/store/auth';
import { colors } from '../../src/theme/colors';

export default function SettingsIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const clear = useAuthStore((s) => s.clear);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView>
        <Row label="Discovery" onPress={() => router.push('/settings/discovery')} />
        <Row label="Premium plans" onPress={() => router.push('/settings/premium')} />
        <Row
          label="Sign out"
          danger
          onPress={() => {
            Alert.alert('Sign out?', undefined, [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign out',
                style: 'destructive',
                onPress: async () => {
                  await clear();
                  router.replace('/(auth)/welcome');
                },
              },
            ]);
          }}
        />
      </ScrollView>
    </View>
  );
}

function Row({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={[styles.rowLabel, danger && { color: colors.report }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '500' },
});
