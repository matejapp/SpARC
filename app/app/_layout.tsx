import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';

import { queryClient } from '@/lib/queryClient';
import { restoreSession, useSessionStatus } from '@/lib/session';
import { restoreThemeMode, useTheme, useThemeRestored } from '@/lib/theme';

export default function RootLayout() {
  const { colors, scheme } = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const session = useSessionStatus();
  const themeRestored = useThemeRestored();
  // React Navigation paints its own containers (behind screens, during transitions) from its
  // theme; without this it stays light grey under the dark palette.
  const navigationTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.ground,
        card: colors.surface,
        text: colors.ink,
        border: colors.hairline,
      },
    };
  }, [scheme, colors]);

  useEffect(() => {
    restoreSession();
    restoreThemeMode();
  }, []);

  // Hold the first frame until the type, the stored session and the saved theme are ready, so
  // a signed-in user never sees the login screen flash, nor a light user a dark frame. If fonts
  // fail, render anyway with the system font.
  if ((!fontsLoaded && !fontError) || session === 'restoring' || !themeRestored) return null;

  const signedIn = session === 'signedIn';
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ground } }}
        >
          {/* Every route must sit in one of these groups: a screen outside both is reachable
              signed out. When the session changes, expo-router redirects to `redirectTo`. It has
              to be named: the default target is the open group's bare path, and "/(auth)" has
              no index, so a logout would land on "Unmatched route". */}
          <Stack.Protected guard={signedIn} redirectTo="/login">
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="add" options={{ presentation: 'modal' }} />
            <Stack.Screen name="settings" />
            <Stack.Screen name="transaction/[id]" />
            <Stack.Screen name="bills" />
            <Stack.Screen name="bill/new" options={{ presentation: 'modal' }} />
            <Stack.Screen name="bill/[id]/index" />
            <Stack.Screen name="bill/[id]/edit" options={{ presentation: 'modal' }} />
          </Stack.Protected>
          <Stack.Protected guard={!signedIn} redirectTo="/">
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
