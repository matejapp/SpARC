import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SparcMark } from '@/components/SparcMark';
import { Wordmark } from '@/components/Wordmark';
import { colors, radii, shadows, spacing, type } from '@/lib/theme';

// Placeholder: brand, headline and the primary button as drawn. The form, validation
// and the real sign-in arrive with card #25.
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 16) },
      ]}
    >
      <View style={styles.brand}>
        <SparcMark size={36} />
        <Wordmark />
      </View>

      <View style={styles.copy}>
        <Text accessibilityRole="header" style={styles.headline}>
          Know where your money goes.
        </Text>
        <Text style={styles.sub}>Log in to see this month.</Text>
      </View>

      <Pressable
        onPress={() => router.replace('/')}
        accessibilityRole="button"
        style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
      >
        <Text style={styles.primaryLabel}>Continue to the app</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ground,
    paddingHorizontal: spacing.gutter,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  copy: { flex: 1, justifyContent: 'center', gap: 8 },
  headline: {
    ...type.display,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  sub: { ...type.body, color: colors.ink2 },
  primary: {
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadows.primaryButton,
  },
  pressed: { opacity: 0.85 },
  primaryLabel: { ...type.button, color: colors.onInk },
});
