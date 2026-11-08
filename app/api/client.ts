import { getApiBaseUrl } from '@/lib/config';
import { clearSession, getTokens, saveTokens } from '@/lib/session';
import type { TokenResponse } from '@/types/api';

// The one way the app talks to the API. Screens never call fetch: they use the per-resource
// modules in api/, which call apiRequest. Every failure becomes an ApiError.

const TIMEOUT_MS = 15000;
// Refresh slightly before expiry so a token does not run out between check and use.
const EXPIRY_SKEW_MS = 30_000;

export type ApiErrorKind = 'http' | 'network' | 'timeout';

export class ApiError extends Error {
  constructor(
    readonly status: number, // 0 when no response arrived
    message: string,
    /** Field name (camelCase, as in the request body) → first message for it. */
    readonly fieldErrors: Record<string, string> = {},
    readonly kind: ApiErrorKind = 'http',
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /**
   * A multipart body instead of JSON (a receipt photo). fetch sets the Content-Type with its
   * boundary itself. A file part is an expo-file-system File, read again on every send, so the
   * one retry after a refresh sends the file again.
   */
  form?: FormData;
  /** false for the anonymous auth endpoints. */
  auth?: boolean;
  /** Longer than the default for work that takes seconds on the server (OCR). */
  timeoutMs?: number;
};

/** Request under /api/v1 (D-023). Signed-in requests refresh once on a 401, then sign out. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (options.auth === false) return send<T>(path, options, null);

  const token = await usableAccessToken();
  try {
    return await send<T>(path, options, token);
  } catch (e) {
    if (!(e instanceof ApiError && e.status === 401)) throw e;
  }
  const refreshed = await refreshAccessToken();
  try {
    return await send<T>(path, options, refreshed);
  } catch (e) {
    // A fresh token rejected again means the session is gone server-side.
    if (e instanceof ApiError && e.status === 401) await clearSession();
    throw e;
  }
}

async function usableAccessToken(): Promise<string> {
  const tokens = getTokens();
  if (!tokens) throw new ApiError(401, 'You are signed out.');
  if (tokens.accessTokenExpiresAt - EXPIRY_SKEW_MS > Date.now()) return tokens.accessToken;
  return refreshAccessToken();
}

let refreshInFlight: Promise<string> | null = null;

/**
 * Exchanges the refresh token for a new pair. Single-flight: every caller waiting on a refresh
 * shares one request, because the API treats a second use of a rotated token as theft and
 * revokes the whole login (D-021). Only a rejected token signs out — a network failure keeps
 * the session for the next try.
 */
export function refreshAccessToken(): Promise<string> {
  refreshInFlight ??= (async () => {
    const tokens = getTokens();
    if (!tokens) throw new ApiError(401, 'You are signed out.');
    try {
      const response = await send<TokenResponse>(
        '/auth/refresh',
        { method: 'POST', body: { refreshToken: tokens.refreshToken } },
        null,
      );
      await saveTokens(response);
      return response.accessToken;
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 400)) await clearSession();
      throw e;
    }
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function send<T>(path: string, options: RequestOptions, token: string | null): Promise<T> {
  let url: string;
  try {
    url = `${getApiBaseUrl()}/api/v1${path}${queryString(options.query)}`;
  } catch (e) {
    throw new ApiError(0, (e as Error).message, {}, 'network');
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.form ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
      signal: controller.signal,
    });
  } catch {
    throw controller.signal.aborted
      ? new ApiError(0, 'The server took too long to answer. Try again.', {}, 'timeout')
      : new ApiError(0, "Can't reach the server. Check your connection and try again.", {}, 'network');
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  const data: unknown = text ? safeJson(text) : undefined;
  if (!response.ok) throw toApiError(response, data);
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

type ProblemDetails = { title?: string; detail?: string; errors?: Record<string, string[]> };

function toApiError(response: Response, data: unknown): ApiError {
  const problem = (data ?? {}) as ProblemDetails;
  const fieldErrors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(problem.errors ?? {})) {
    const field = fieldName(key);
    if (field && messages[0] && !fieldErrors[field]) fieldErrors[field] = messages[0];
  }

  let message: string;
  if (response.status === 429) {
    const wait = response.headers.get('Retry-After');
    message = wait
      ? `Too many attempts. Try again in ${wait} seconds.`
      : 'Too many attempts. Wait a minute and try again.';
  } else if (response.status >= 500) {
    message = 'Something went wrong on the server. Try again.';
  } else {
    message = problem.detail ?? problem.title ?? `Request failed (${response.status}).`;
  }
  return new ApiError(response.status, message, fieldErrors);
}

// ASP.NET keys field errors by property name ("Amount") or JSON path ("$.amount"); the form
// fields are camelCase body names.
function fieldName(key: string): string | null {
  const last = key.replace(/^\$\.?/, '').split('.').pop() ?? '';
  return last ? last.charAt(0).toLowerCase() + last.slice(1) : null;
}

function queryString(query: RequestOptions['query']): string {
  const parts = Object.entries(query ?? {})
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}
