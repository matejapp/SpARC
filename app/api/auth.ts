import { apiRequest } from '@/api/client';
import { clearSession, getTokens, saveTokens } from '@/lib/session';
import type { LoginRequest, RegisterRequest, TokenResponse, UserResponse } from '@/types/api';

/** Creates the account. Issues no tokens (D-020): the caller signs in next. */
export function register(request: RegisterRequest): Promise<UserResponse> {
  return apiRequest<UserResponse>('/auth/register', { method: 'POST', body: request, auth: false });
}

export async function signIn(request: LoginRequest): Promise<void> {
  const tokens = await apiRequest<TokenResponse>('/auth/login', {
    method: 'POST',
    body: request,
    auth: false,
  });
  await saveTokens(tokens);
}

/**
 * Revokes this login server-side, then forgets it on the phone. A logout that only clears the
 * phone is not a logout (D-022), so a failed call throws and the session stays; the screen
 * decides whether to sign out locally anyway.
 */
export async function signOut(): Promise<void> {
  const tokens = getTokens();
  if (tokens) {
    await apiRequest<void>('/auth/logout', {
      method: 'POST',
      body: { refreshToken: tokens.refreshToken },
    });
  }
  await clearSession();
}
