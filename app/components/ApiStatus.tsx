import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { checkHealth, type HealthResult } from '@/api/health';
import { colors, radii, shadows, type } from '@/lib/theme';

// Card #21's proof that the phone reaches the API: GET /health from the device, shown on Home.
// A development aid — it goes when the real dashboard (card #29) replaces the placeholder.

const HINTS: Record<Exclude<HealthResult, { ok: true }>['reason'], string> = {
  config: 'Set EXPO_PUBLIC_API_URL in app/.env, then restart Expo.',
  unreachable:
    'Is the API running with the "lan" profile? Is the PC on a Private network with the ' +
    'firewall rule for port 5263? Is the address the PC\'s current LAN IP?',
  timeout: 'The request left the phone but nothing answered — usually the firewall.',
  unhealthy: 'The API answered but could not reach the database. Its console has the cause.',
};

export function ApiStatus() {
  const [result, setResult] = useState<HealthResult | null>(null);

  const run = useCallback(async () => {
    setResult(null);
    setResult(await checkHealth());
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  return (
    <View style={styles.card} accessibilityLiveRegion="polite">
      <Text style={styles.label}>API connection</Text>
      {result === null ? (
        <Text style={styles.status}>Checking…</Text>
      ) : result.ok ? (
        <Text style={[styles.status, styles.ok]}>Connected — /health answered 200</Text>
      ) : (
        <>
          <Text style={[styles.status, styles.failed]} accessibilityRole="alert">
            Not connected ({result.detail})
          </Text>
          <Text style={styles.hint}>{HINTS[result.reason]}</Text>
          <Pressable
            onPress={run}
            accessibilityRole="button"
            style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
          >
            <Text style={styles.retryLabel}>Try again</Text>
          </Pressable>
        </>
      )}
      {result?.url ? <Text style={styles.url}>{result.url}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 20,
    gap: 8,
    boxShadow: shadows.card,
  },
  label: { ...type.caption, color: colors.ink2 },
  status: { ...type.headline, color: colors.ink },
  ok: { color: colors.income },
  failed: { color: colors.error },
  hint: { ...type.body, color: colors.ink2 },
  url: { ...type.caption, color: colors.ink2 },
  retry: {
    alignSelf: 'flex-start',
    height: 44,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    boxShadow: shadows.outline,
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  retryLabel: { ...type.buttonSmall, color: colors.ink },
});
