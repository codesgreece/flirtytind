import { View, Text, StyleSheet, FlatList, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLikesReceived } from '../../src/hooks/queries';
import { EmptyState, LoadingState, ErrorState } from '../../src/components/EmptyState';
import { colors } from '../../src/theme/colors';
import { radii } from '../../src/theme/typography';

export default function LikesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const likes = useLikesReceived();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Likes</Text>
      {likes.isLoading ? (
        <LoadingState />
      ) : likes.isError ? (
        <ErrorState onRetry={() => likes.refetch()} />
      ) : !likes.data?.items.length ? (
        <EmptyState
          title="No likes yet"
          subtitle="When someone likes you, they’ll show up here."
          actionLabel="See plans"
          onAction={() => router.push('/settings/premium')}
        />
      ) : (
        <FlatList
          data={likes.data.items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={({ item }) => {
            const uri = item.fromUser.photos?.[0]?.url;
            return (
              <Pressable
                style={styles.card}
                onPress={() => router.push('/settings/premium')}
              >
                {uri ? (
                  <Image source={{ uri }} style={styles.img} blurRadius={18} />
                ) : (
                  <View style={[styles.img, styles.ph]} />
                )}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.fade}
                >
                  <Text style={styles.name}>{item.fromUser.firstName}</Text>
                </LinearGradient>
              </Pressable>
            );
          }}
        />
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
  list: { padding: 16, gap: 12 },
  card: {
    flex: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
    aspectRatio: 0.72,
    marginBottom: 4,
  },
  img: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  ph: { backgroundColor: colors.bgGray },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
  },
  name: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
