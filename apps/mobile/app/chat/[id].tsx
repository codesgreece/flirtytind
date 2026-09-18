import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatBubble } from '../../src/components/ChatBubble';
import { BackButton } from '../../src/components/BackButton';
import { LoadingState, ErrorState } from '../../src/components/EmptyState';
import { useMessages, useSendMessage, useConversations } from '../../src/hooks/queries';
import { messagesApi } from '../../src/api/endpoints';
import { getSocket } from '../../src/api/socket';
import { useAuthStore } from '../../src/store/auth';
import { colors } from '../../src/theme/colors';
import { radii } from '../../src/theme/typography';
import { REALTIME_EVENTS } from '@flirty/shared';
import { useQueryClient } from '@tanstack/react-query';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id!;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);
  const messages = useMessages(conversationId);
  const send = useSendMessage(conversationId);
  const conversations = useConversations();
  const [text, setText] = useState('');
  const [showPushBanner, setShowPushBanner] = useState(true);
  const qc = useQueryClient();

  const conversation = conversations.data?.find((c) => c.id === conversationId);
  const other = conversation?.otherUser;

  useEffect(() => {
    void messagesApi.markRead(conversationId).catch(() => undefined);
  }, [conversationId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onMessage = () => {
      qc.invalidateQueries({ queryKey: ['messages', conversationId] });
    };
    socket.on(REALTIME_EVENTS.MESSAGE_CREATED, onMessage);
    return () => {
      socket.off(REALTIME_EVENTS.MESSAGE_CREATED, onMessage);
    };
  }, [conversationId, qc]);

  const onSend = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    try {
      await send.mutateAsync(body);
    } catch {
      setText(body);
    }
  };

  const items = [...(messages.data ?? [])].reverse();

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Pressable
          style={styles.headerCenter}
          onPress={() => other && router.push(`/profile/${other.id}`)}
        >
          {other?.photos?.[0]?.url ? (
            <Image source={{ uri: other.photos[0].url }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.ph]} />
          )}
          <Text style={styles.headerName}>{other?.firstName ?? 'Chat'}</Text>
        </Pressable>
        <View style={styles.headerRight}>
          <Ionicons name="videocam" size={24} color={colors.linkBlue} />
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.textMuted} />
        </View>
      </View>

      {showPushBanner ? (
        <LinearGradient colors={[...colors.brandGradient]} style={styles.pushBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pushTitle}>
              See when {other?.firstName ?? 'they'} answers
            </Text>
            <Text style={styles.pushSub}>Enable push notifications</Text>
          </View>
          <Pressable style={styles.enableBtn} onPress={() => setShowPushBanner(false)}>
            <Text style={styles.enableText}>Enable</Text>
          </Pressable>
        </LinearGradient>
      ) : null}

      {messages.isLoading ? (
        <LoadingState />
      ) : messages.isError ? (
        <ErrorState onRetry={() => messages.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          inverted
          ListFooterComponent={
            <View style={styles.matchIntro}>
              <Text style={styles.matchLine}>
                {items.length === 0
                  ? `You matched with ${other?.firstName ?? 'them'}`
                  : `YOU MATCHED WITH ${(other?.firstName ?? '').toUpperCase()}`}
              </Text>
              {items.length === 0 ? (
                <>
                  <Text style={styles.readPrompt}>
                    Know when {other?.firstName ?? 'they'} has read your message.
                  </Text>
                  <Pressable
                    style={styles.readBtn}
                    onPress={() => router.push('/settings/premium')}
                  >
                    <Ionicons name="checkmark-done" size={18} color={colors.white} />
                    <Text style={styles.readBtnText}>Get Read Receipts</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <ChatBubble
              body={item.body}
              outgoing={item.senderId === userId}
              status={item.status}
            />
          )}
        />
      )}

      <View style={[styles.composer, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.inputPill}>
          <TextInput
            style={styles.input}
            placeholder="Type a message"
            placeholderTextColor={colors.textPlaceholder}
            value={text}
            onChangeText={setText}
            multiline
          />
          <Pressable onPress={onSend} disabled={!text.trim()}>
            <Text
              style={[
                styles.send,
                { color: text.trim() ? colors.linkBlue : colors.textMuted },
              ]}
            >
              Send
            </Text>
          </Pressable>
        </View>
        <View style={styles.utils}>
          <View style={[styles.util, { backgroundColor: colors.linkBlue }]}>
            <Ionicons name="id-card" size={20} color={colors.white} />
          </View>
          <View style={[styles.util, { backgroundColor: colors.bgGray }]}>
            <Text style={styles.gif}>GIF</Text>
          </View>
          <View style={[styles.util, { backgroundColor: '#4CD964' }]}>
            <Ionicons name="musical-notes" size={20} color={colors.white} />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  ph: { backgroundColor: colors.bgGray },
  headerName: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: 14, width: 70, justifyContent: 'flex-end' },
  pushBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  pushTitle: { color: colors.white, fontWeight: '700', fontSize: 14 },
  pushSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
  enableBtn: {
    borderWidth: 1.5,
    borderColor: colors.white,
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  enableText: { color: colors.white, fontWeight: '700' },
  list: { padding: 16, flexGrow: 1 },
  matchIntro: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  matchLine: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  readPrompt: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.linkBlue,
    borderRadius: radii.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 4,
  },
  readBtnText: { color: colors.white, fontWeight: '700' },
  composer: { paddingHorizontal: 12, gap: 10 },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    minHeight: 48,
    backgroundColor: colors.white,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 10, maxHeight: 100 },
  send: { fontWeight: '700', fontSize: 16, paddingLeft: 8 },
  utils: { flexDirection: 'row', gap: 12, paddingLeft: 4 },
  util: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gif: { fontWeight: '800', fontSize: 11, color: colors.textPrimary },
});
