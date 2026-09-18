import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { radii } from '../theme/typography';

type Props = {
  uris: string[];
  onChange: (uris: string[]) => void;
  max?: number;
};

export function PhotoGrid({ uris, onChange, max = 6 }: Props) {
  const slots = Array.from({ length: max }, (_, i) => uris[i] ?? null);

  const pick = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (result.canceled || !result.assets[0]) return;
    const next = [...uris];
    next[index] = result.assets[0].uri;
    onChange(next.filter(Boolean) as string[]);
  };

  const remove = (index: number) => {
    const next = uris.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <View style={styles.grid}>
      {slots.map((uri, i) => (
        <Pressable key={i} style={styles.slot} onPress={() => (uri ? remove(i) : pick(i))}>
          {uri ? (
            <Image source={{ uri }} style={styles.image} />
          ) : (
            <View style={styles.empty} />
          )}
          <LinearGradient
            colors={[...colors.brandGradient]}
            style={styles.addBtn}
          >
            <Text style={styles.addText}>{uri ? '×' : '+'}</Text>
          </LinearGradient>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slot: {
    width: '31%',
    aspectRatio: 0.72,
    borderRadius: radii.md,
    overflow: 'visible',
    position: 'relative',
  },
  empty: {
    flex: 1,
    backgroundColor: colors.bgSlot,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: '#C8C8C8',
    borderStyle: 'dashed',
  },
  image: {
    flex: 1,
    width: '100%',
    borderRadius: radii.md,
  },
  addBtn: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  addText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
});
