import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SwipeAction } from '@flirty/shared';
import {
  authApi,
  discoverApi,
  swipesApi,
  matchesApi,
  messagesApi,
  likesApi,
  preferencesApi,
  profilesApi,
  subscriptionsApi,
  type DiscoverProfile,
} from '../api/endpoints';

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => profilesApi.me(),
    retry: false,
  });
}

export function useDiscover() {
  return useQuery({
    queryKey: ['discover'],
    queryFn: async () => {
      const res = await discoverApi.list({ limit: 20 });
      return res.items ?? [];
    },
  });
}

export function useSwipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ targetUserId, action }: { targetUserId: string; action: SwipeAction }) =>
      swipesApi.create(targetUserId, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['discover'] });
      qc.invalidateQueries({ queryKey: ['matches'] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['likes'] });
      qc.invalidateQueries({ queryKey: ['entitlements'] });
    },
  });
}

export function useMatches() {
  return useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const res = await matchesApi.list();
      return Array.isArray(res) ? res : [];
    },
  });
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await messagesApi.conversations();
      return Array.isArray(res) ? res : [];
    },
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => (await messagesApi.list(conversationId)).items ?? [],
    enabled: !!conversationId,
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => messagesApi.send(conversationId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useLikesReceived() {
  return useQuery({
    queryKey: ['likes'],
    queryFn: async () => {
      const res = await likesApi.received();
      const items = Array.isArray(res) ? res : [];
      return {
        items: items.map((l) => ({
          id: l.id,
          createdAt: l.createdAt,
          isSuperLike: l.isSuper,
          fromUser: {
            id: l.user.id,
            firstName: l.user.firstName ?? '',
            photos: l.user.photo ? [l.user.photo] : [],
          },
        })),
        count: items.length,
      };
    },
  });
}

export function usePreferences() {
  return useQuery({
    queryKey: ['preferences'],
    queryFn: () => preferencesApi.get(),
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: preferencesApi.update,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['preferences'] });
      qc.invalidateQueries({ queryKey: ['discover'] });
    },
  });
}

export function useProfile(id: string) {
  return useQuery({
    queryKey: ['profile', id],
    queryFn: () => profilesApi.getById(id),
    enabled: !!id,
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionsApi.current(),
  });
}

export function useEntitlements() {
  return useQuery({
    queryKey: ['entitlements'],
    queryFn: () => subscriptionsApi.entitlements(),
  });
}

export function useAuthMe() {
  return useQuery({
    queryKey: ['auth-me'],
    queryFn: () => authApi.me(),
    retry: false,
  });
}

export type { DiscoverProfile };
