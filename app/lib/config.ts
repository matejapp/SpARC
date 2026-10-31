// Where the API lives: EXPO_PUBLIC_API_URL in app/.env (git-ignored, see .env.example).
// The phone's localhost is the phone, so in development this is the PC's LAN address.
// Expo inlines EXPO_PUBLIC_* values when it bundles: restart `npx expo start` after a change.
// Anything EXPO_PUBLIC_ ends up in the app bundle — never put a secret in one.

const API_URL_SHAPE = /^https?:\/\/[^\s/?#]+$/;

export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
  if (!raw) {
    throw new Error('EXPO_PUBLIC_API_URL is not set. Add it to app/.env and restart Expo.');
  }
  if (!API_URL_SHAPE.test(raw)) {
    throw new Error(
      `EXPO_PUBLIC_API_URL must be scheme://host[:port] with no path, got "${raw}".`,
    );
  }
  // Plain HTTP is a development-only allowance inside Expo Go (D-030). Any other build sends
  // passwords and tokens, so it must not be able to send them in the clear.
  if (!__DEV__ && !raw.startsWith('https://')) {
    throw new Error('EXPO_PUBLIC_API_URL must be https:// outside development.');
  }
  return raw;
}
