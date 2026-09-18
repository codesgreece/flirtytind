import { create } from 'zustand';
import { storageDelete, storageGet, storageSet } from '../storage/tokenStorage';

const ACCESS_KEY = 'flirty_access_token';
const REFRESH_KEY = 'flirty_refresh_token';
const USER_KEY = 'flirty_user';

export type AuthUser = {
  id: string;
  email: string;
  firstName?: string | null;
  onboardingComplete?: boolean;
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (payload: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  }) => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: AuthUser | null) => Promise<void>;
  clear: () => Promise<void>;
};

async function save(key: string, value: string | null) {
  if (value == null) {
    await storageDelete(key);
  } else {
    await storageSet(key, value);
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const [accessToken, refreshToken, userRaw] = await Promise.all([
        storageGet(ACCESS_KEY),
        storageGet(REFRESH_KEY),
        storageGet(USER_KEY),
      ]);
      set({
        accessToken,
        refreshToken,
        user: userRaw ? (JSON.parse(userRaw) as AuthUser) : null,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  setSession: async ({ accessToken, refreshToken, user }) => {
    await Promise.all([
      save(ACCESS_KEY, accessToken),
      save(REFRESH_KEY, refreshToken),
      save(USER_KEY, JSON.stringify(user)),
    ]);
    set({ accessToken, refreshToken, user });
  },

  setTokens: async (accessToken, refreshToken) => {
    await Promise.all([
      save(ACCESS_KEY, accessToken),
      save(REFRESH_KEY, refreshToken),
    ]);
    set({ accessToken, refreshToken });
  },

  setUser: async (user) => {
    await save(USER_KEY, user ? JSON.stringify(user) : null);
    set({ user });
  },

  clear: async () => {
    await Promise.all([
      save(ACCESS_KEY, null),
      save(REFRESH_KEY, null),
      save(USER_KEY, null),
    ]);
    set({ accessToken: null, refreshToken: null, user: null });
  },
}));

export function getAccessToken() {
  return useAuthStore.getState().accessToken;
}

export function getRefreshToken() {
  return useAuthStore.getState().refreshToken;
}
