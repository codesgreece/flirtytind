import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDiscover } from '../../src/hooks/queries';
import { EmptyState, LoadingState, ErrorState } from '../../src/components/EmptyState';
import { colors } from '../../src/theme/colors';
import { radii } from '../../src/theme/typography';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const discover = useDiscover();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Explore</Text>
      {discover.isLoading ? (
        <LoadingState />
      ) : discover.isError ? (
        <ErrorState onRetry={() => discover.refetch()} />
      ) : !discover.data?.length ? (
        <EmptyState
          title="Nothing to explore yet"
          subtitle="Check back when more people are nearby."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {discover.data.map((p) => {
            const uri = p.photos?.[0]?.url;
            return (
              <Pressable
                key={p.userId}
                style={styles.card}
                onPress={() => router.push(`/profile/${p.userId}`)}
              >
                {uri ? (
                  <Image source={{ uri }} style={styles.img} />
                ) : (
                  <View style={[styles.img, styles.ph]}>
                    <Text style={styles.phText}>{p.firstName?.[0]}</Text>
                  </View>
                )}
                <Text style={styles.name}>{p.firstName}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  title: {
    fontSize: 28,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 10,
  },
  card: {
    width: '47%',
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  img: {
    width: '100%',
    aspectRatio: 0.75,
    borderRadius: radii.lg,
    backgroundColor: colors.bgGray,
  },
  ph: { alignItems: 'center', justifyContent: 'center' },
  phText: { fontSize: 40, fontWeight: '700', color: colors.textMuted },
  name: {
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
