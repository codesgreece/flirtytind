import { getAccessToken, getRefreshToken, useAuthStore } from '../store/auth';

const API_BASE =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/$/, '') +
  '/api/v1';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
  formData?: FormData;
};

let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      await useAuthStore.getState().clear();
      return false;
    }
    const data = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
      user?: { id: string; email: string; firstName?: string | null; onboardingComplete?: boolean };
    };
    if (data.user) {
      await useAuthStore.getState().setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
    } else {
      await useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
    }
    return true;
  } catch {
    return false;
  }
}

async function ensureRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, auth = true, headers = {}, formData } = options;
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

  const buildHeaders = (): Record<string, string> => {
    const h: Record<string, string> = { Accept: 'application/json', ...headers };
    if (!formData) h['Content-Type'] = 'application/json';
    if (auth) {
      const token = getAccessToken();
      if (token) h.Authorization = `Bearer ${token}`;
    }
    return h;
  };

  const doFetch = () =>
    fetch(url, {
      method,
      headers: buildHeaders(),
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });

  let res = await doFetch();

  if (res.status === 401 && auth) {
    const ok = await ensureRefresh();
    if (ok) res = await doFetch();
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let parsed: unknown = undefined;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const message =
      typeof parsed === 'object' &&
      parsed &&
      'message' in parsed &&
      typeof (parsed as { message: unknown }).message === 'string'
        ? (parsed as { message: string }).message
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, message, parsed);
  }

  return parsed as T;
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...opts, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...opts, method: 'PUT', body }),
  delete: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...opts, method: 'DELETE' }),
};

export { API_BASE };
