import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/lib/theme';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Hold the first frame until the type is ready. If loading fails, render anyway:
  // the system font is a better outcome than a blank app.
  if (!fontsLoaded && !fontError) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ground } }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="add" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
