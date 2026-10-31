import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { queryClient } from '@/lib/queryClient';
import { restoreSession, useSessionStatus } from '@/lib/session';
import { colors, scheme } from '@/lib/theme';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const session = useSessionStatus();

  useEffect(() => {
    restoreSession();
  }, []);

  // Hold the first frame until the type and the stored session are ready, so a signed-in
  // user never sees the login screen flash. If fonts fail, render anyway with the system font.
  if ((!fontsLoaded && !fontError) || session === 'restoring') return null;

  const signedIn = session === 'signedIn';
  return (
    <QueryClientProvider client={queryClient}>
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
        </Stack.Protected>
        <Stack.Protected guard={!signedIn} redirectTo="/">
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </QueryClientProvider>
  );
}
