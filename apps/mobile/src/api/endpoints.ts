import { api, apiRequest } from './client';
import type {
  Gender,
  LookingFor,
  PlanCode,
  ShowMe,
  SwipeAction,
} from '@flirty/shared';
import type {
  LoginInput,
  RegisterInput,
  PreferencesInput,
  UpdateProfileInput,
} from '@flirty/validation';

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    onboardingComplete?: boolean;
  };
};

export type ProfilePhoto = {
  id: string;
  url: string;
  sortOrder: number;
};

export type Profile = {
  id: string;
  userId: string;
  firstName: string;
  birthDate: string;
  age?: number;
  gender?: Gender;
  showGenderOnProfile?: boolean;
  orientations?: string[];
  showOrientationOnProfile?: boolean;
  bio?: string | null;
  lookingFor?: LookingFor | null;
  drinking?: string | null;
  smoking?: string | null;
  workout?: string | null;
  pets?: string | null;
  education?: string | null;
  loveStyle?: string | null;
  zodiac?: string | null;
  communicationStyle?: string | null;
  heightCm?: number | null;
  city?: string | null;
  photos?: ProfilePhoto[];
  interests?: { id: string; label: string }[];
  distanceKm?: number | null;
  isActive?: boolean;
  isNearby?: boolean;
  verified?: boolean;
};

export type DiscoverProfile = Profile & {
  userId: string;
};

export type MatchItem = {
  id: string;
  createdAt: string;
  conversationId?: string;
  otherUser: {
    id: string;
    firstName: string;
    photos?: ProfilePhoto[];
  };
};

export type ConversationItem = {
  id: string;
  matchId?: string;
  updatedAt: string;
  lastMessage?: {
    id: string;
    body: string;
    createdAt: string;
    senderId: string;
    status?: string;
  } | null;
  otherUser: {
    id: string;
    firstName: string;
    photos?: ProfilePhoto[];
    verified?: boolean;
  };
  unreadCount?: number;
};

export type MessageItem = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  status?: string;
  clientMessageId?: string;
};

export type LikeReceived = {
  id: string;
  createdAt: string;
  fromUser: {
    id: string;
    firstName: string;
    photos?: ProfilePhoto[];
  };
  isSuperLike?: boolean;
};

export type SubscriptionInfo = {
  planCode: PlanCode;
  status: string;
  currentPeriodEnd?: string | null;
};

export type Preferences = PreferencesInput & {
  showMe: ShowMe;
  minAge: number;
  maxAge: number;
  maxDistanceKm: number;
};

export const authApi = {
  register: (input: RegisterInput) =>
    api.post<AuthResponse>('/auth/register', input, { auth: false }),
  login: (input: LoginInput) =>
    api.post<AuthResponse>('/auth/login', input, { auth: false }),
  refresh: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refreshToken }, { auth: false }),
  me: () => api.get<AuthResponse['user'] & { profile?: Profile }>('/users/me'),
};

export const profilesApi = {
  me: () => api.get<Profile>('/profiles/me'),
  updateMe: (input: UpdateProfileInput) => api.patch<Profile>('/profiles/me', input),
  getById: (id: string) => api.get<Profile>(`/profiles/${id}`),
  uploadPhoto: (formData: FormData) =>
    apiRequest<ProfilePhoto>('/photos/upload', {
      method: 'POST',
      formData,
      auth: true,
    }),
  deletePhoto: (photoId: string) => api.delete(`/photos/${photoId}`),
  reorderPhotos: (photoIds: string[]) =>
    api.patch('/photos/reorder', { photoIds }),
};

export const preferencesApi = {
  get: () => api.get<Preferences>('/preferences/me'),
  update: (input: PreferencesInput) => api.patch<Preferences>('/preferences/me', input),
};

export const discoverApi = {
  list: (params?: { cursor?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.cursor) q.set('cursor', params.cursor);
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api.get<{ items: DiscoverProfile[]; nextCursor?: string | null }>(
      `/discover/feed${qs ? `?${qs}` : ''}`,
    );
  },
};

export const swipesApi = {
  create: (targetUserId: string, action: SwipeAction) =>
    api.post<{ matched: boolean; matchId?: string; conversationId?: string }>('/swipes', {
      targetUserId,
      action,
    }),
  rewind: () => api.post<{ ok: boolean }>('/swipes/rewind'),
};

export const matchesApi = {
  list: () => api.get<MatchItem[]>('/matches'),
  get: (id: string) => api.get<MatchItem>(`/matches/${id}`),
};

export const messagesApi = {
  conversations: () => api.get<ConversationItem[]>('/messages/conversations'),
  list: (conversationId: string, cursor?: string) => {
    const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    return api.get<{ items: MessageItem[]; nextCursor?: string | null }>(
      `/messages/conversations/${conversationId}${q}`,
    );
  },
  send: (conversationId: string, body: string, clientMessageId?: string) =>
    api.post<MessageItem>('/messages', { conversationId, body, clientMessageId }),
  direct: (targetUserId: string, body: string) =>
    api.post<MessageItem>('/messages/direct', { targetUserId, body }),
  markRead: (conversationId: string) =>
    api.patch(`/messages/conversations/${conversationId}/read`),
};

export const likesApi = {
  received: () =>
    api.get<
      Array<{
        id: string;
        isSuper: boolean;
        createdAt: string;
        user: {
          id: string;
          firstName: string | null;
          photo: ProfilePhoto | null;
        };
      }>
    >('/likes/received'),
};

export const notificationsApi = {
  list: () => api.get<{ items: unknown[] }>('/notifications'),
  markRead: (ids?: string[]) => api.patch('/notifications/read', { ids }),
};

export const devicesApi = {
  register: (input: {
    token: string;
    platform: 'ios' | 'android' | 'web';
    deviceId?: string;
  }) =>
    api.post<{ ok: boolean }>('/devices/register', input),
};

export const subscriptionsApi = {
  current: () => api.get<SubscriptionInfo>('/subscriptions/me'),
  subscribe: (planCode: PlanCode) =>
    api.post<SubscriptionInfo>('/subscriptions/subscribe', { planCode }),
  entitlements: () =>
    api.get<{
      planCode: PlanCode;
      likesRemaining: number | null;
      superLikesRemaining: number;
      rewindsRemaining: number | null;
      dmsRemaining: number | null;
      boostsRemaining: number;
    }>('/entitlements/me'),
};

export const blocksApi = {
  create: (blockedUserId: string) => api.post('/blocks', { blockedUserId }),
  list: () => api.get<{ items: { id: string; blockedUserId: string }[] }>('/blocks'),
};

export const reportsApi = {
  create: (reportedUserId: string, category: string, description?: string) =>
    api.post('/reports', { reportedUserId, category, description }),
};
