import { View, Text, StyleSheet, FlatList, Image, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandLogo, FlameIcon } from '../../src/components/BrandLogo';
import { EmptyState, LoadingState, ErrorState } from '../../src/components/EmptyState';
import { useConversations, useMatches, useLikesReceived } from '../../src/hooks/queries';
import { colors } from '../../src/theme/colors';
import { radii } from '../../src/theme/typography';

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const conversations = useConversations();
  const matches = useMatches();
  const likes = useLikesReceived();

  const loading = conversations.isLoading || matches.isLoading;
  const error = conversations.isError && matches.isError;
  const hasData =
    (conversations.data?.length ?? 0) > 0 || (matches.data?.length ?? 0) > 0;
  const likeCount = likes.data?.count ?? 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ width: 28 }} />
        <BrandLogo size="sm" color={colors.brandMagenta} />
        <Pressable hitSlop={10}>
          <Ionicons name="shield-checkmark-outline" size={24} color={colors.textMuted} />
        </Pressable>
      </View>

      {loading ? (
        <LoadingState />
      ) : error && !hasData ? (
        <ErrorState
          onRetry={() => {
            conversations.refetch();
            matches.refetch();
          }}
        />
      ) : (
        <ScrollView>
          <Text style={styles.section}>New matches</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.matchesRow}
          >
            <Pressable style={styles.likesCard} onPress={() => router.push('/(tabs)/likes')}>
              <LinearGradient
                colors={['#F5C518', '#E8A317']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.likesBorder}
              >
                <View style={styles.likesInner}>
                  <View style={styles.likesBadge}>
                    <Ionicons name="heart" size={16} color={colors.white} />
                  </View>
                </View>
              </LinearGradient>
              <Text style={styles.likesText}>
                {likeCount} like{likeCount === 1 ? '' : 's'}
              </Text>
            </Pressable>
            {(matches.data ?? []).map((m) => {
              const uri = m.otherUser.photos?.[0]?.url;
              return (
                <Pressable
                  key={m.id}
                  style={styles.matchCard}
                  onPress={() =>
                    router.push(
                      m.conversationId ? `/chat/${m.conversationId}` : `/match/${m.id}`,
                    )
                  }
                >
                  {uri ? (
                    <Image source={{ uri }} style={styles.matchImg} />
                  ) : (
                    <View style={[styles.matchImg, styles.ph]}>
                      <Text style={styles.phText}>{m.otherUser.firstName[0]}</Text>
                    </View>
                  )}
                  <Text style={styles.matchName} numberOfLines={1}>
                    {m.otherUser.firstName}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.section}>Messages</Text>
          {(conversations.data ?? []).length === 0 ? (
            <EmptyState
              title="No messages yet"
              subtitle="When you match, your conversations will appear here."
            />
          ) : (
            <FlatList
              data={conversations.data}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const uri = item.otherUser.photos?.[0]?.url;
                const isTeam =
                  /team|flirty greece|support/i.test(item.otherUser.firstName ?? '');
                return (
                  <Pressable
                    style={styles.row}
                    onPress={() => router.push(`/chat/${item.id}`)}
                  >
                    {uri ? (
                      <Image source={{ uri }} style={styles.avatar} />
                    ) : (
                      <LinearGradient
                        colors={[...colors.brandGradient]}
                        style={styles.avatar}
                      >
                        <FlameIcon size={22} color={colors.white} />
                      </LinearGradient>
                    )}
                    {item.unreadCount ? <View style={styles.unreadDot} /> : null}
                    <View style={styles.rowText}>
                      <View style={styles.nameRow}>
                        <Text style={styles.rowName}>
                          {isTeam ? 'Team Flirty Greece' : item.otherUser.firstName}
                        </Text>
                        {(item.otherUser.verified || isTeam) ? (
                          <View style={styles.verified}>
                            <Ionicons name="checkmark" size={10} color={colors.white} />
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.preview} numberOfLines={1}>
                        {item.lastMessage?.body ?? 'Say hello!'}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  section: {
    fontSize: 20,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    color: colors.black,
  },
  matchesRow: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  likesCard: { width: 72, alignItems: 'center' },
  likesBorder: {
    width: 72,
    height: 96,
    borderRadius: radii.md,
    padding: 3,
  },
  likesInner: {
    flex: 1,
    borderRadius: radii.md - 2,
    backgroundColor: colors.bgGray,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
    overflow: 'hidden',
  },
  likesBadge: {
    backgroundColor: '#3A3A3A',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  likesText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    color: colors.textPrimary,
  },
  matchCard: { width: 72 },
  matchImg: {
    width: 72,
    height: 96,
    borderRadius: radii.md,
    backgroundColor: colors.bgGray,
  },
  ph: { alignItems: 'center', justifyContent: 'center' },
  phText: { fontSize: 24, fontWeight: '700', color: colors.textMuted },
  matchName: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    left: 68,
    top: 14,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brandMagenta,
  },
  rowText: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowName: { fontSize: 16, fontWeight: '700', color: colors.black },
  verified: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.brandMagenta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: { color: colors.textSecondary, marginTop: 2, fontSize: 14 },
});
