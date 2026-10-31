import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';

import type { TokenResponse } from '@/types/api';

// The signed-in session: both tokens, kept in expo-secure-store (iOS Keychain, Android
// Keystore) and never in AsyncStorage, which is plain text (F-01.4). One item holds both, so
// a rotated pair is written in one step and the two can never disagree.
//
// A small observable store rather than a library: the API client reads it outside React,
// screens read it through useSessionStatus().

export type SessionStatus = 'restoring' | 'signedIn' | 'signedOut';

type Tokens = {
  accessToken: string;
  accessTokenExpiresAt: number; // epoch ms
  refreshToken: string;
};

const STORAGE_KEY = 'sparc.session';

let tokens: Tokens | null = null;
let status: SessionStatus = 'restoring';
const listeners = new Set<() => void>();

function setState(nextTokens: Tokens | null) {
  tokens = nextTokens;
  status = nextTokens ? 'signedIn' : 'signedOut';
  listeners.forEach((listener) => listener());
}

function parse(raw: string | null): Tokens | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Tokens>;
    if (
      typeof value.accessToken === 'string' &&
      typeof value.refreshToken === 'string' &&
      typeof value.accessTokenExpiresAt === 'number'
    ) {
      return value as Tokens;
    }
  } catch {
    // Unreadable item: treated as no session below; the next sign-in overwrites it.
  }
  return null;
}

/** Cold start: signed in if a stored session exists. An expired access token is refreshed on first use. */
export async function restoreSession(): Promise<void> {
  let raw: string | null = null;
  try {
    raw = await SecureStore.getItemAsync(STORAGE_KEY);
  } catch {
    // Unreadable Keychain/Keystore entry (e.g. after a device restore): start signed out
    // rather than hang on the first frame. The next sign-in overwrites the entry.
  }
  setState(parse(raw));
}

export async function saveTokens(response: TokenResponse): Promise<void> {
  const next: Tokens = {
    accessToken: response.accessToken,
    accessTokenExpiresAt: Date.parse(response.accessTokenExpiresAt),
    refreshToken: response.refreshToken,
  };
  // Persist before publishing: a rotated refresh token that only lived in memory would be
  // lost on a crash, and presenting the old one again revokes the whole family (D-021).
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
  setState(next);
}

export async function clearSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } finally {
    setState(null);
  }
}

export function getTokens(): Tokens | null {
  return tokens;
}

export function getSessionStatus(): SessionStatus {
  return status;
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSessionStatus(): SessionStatus {
  return useSyncExternalStore(subscribeSession, getSessionStatus);
}
