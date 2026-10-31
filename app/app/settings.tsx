import { useMutation } from '@tanstack/react-query';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { signOut } from '@/api/auth';
import { ApiError } from '@/api/client';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { useMe } from '@/hooks/useMe';
import { clearSession } from '@/lib/session';
import { colors, radii, shadows, spacing, type } from '@/lib/theme';

// Profile and settings, opened from the avatar on the dashboard. Sprint 1 holds the account
// and logout; the period and currency settings arrive with their own cards.
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const me = useMe();

  const logout = useMutation({
    mutationFn: signOut,
    onError: (e) => {
      // The server could not be told. Its refresh token stays valid until it expires, so say
      // so and let the user choose rather than pretend the logout happened (D-022).
      const offline = e instanceof ApiError && e.status === 0;
      Alert.alert(
        'Could not log out',
        offline
          ? "The server can't be reached, so this login stays active there until it expires."
          : e.message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log out on this phone', style: 'destructive', onPress: () => clearSession() },
        ],
      );
    },
  });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 16) + 20 },
      ]}
    >
      <ScreenHeader title="Profile and settings" />

      <View style={styles.card}>
        {me.isPending ? (
          <View accessibilityLabel="Loading your account" style={styles.profile}>
            <View style={[styles.avatar, styles.skeleton]} />
            <View style={styles.lines}>
              <View style={[styles.skeleton, styles.lineWide]} />
              <View style={[styles.skeleton, styles.lineNarrow]} />
            </View>
          </View>
        ) : me.isError ? (
          <View style={styles.errorBlock}>
            <Text style={styles.errorText}>Your account details didn't load.</Text>
            <Button label="Try again" variant="link" onPress={() => me.refetch()} />
          </View>
        ) : (
          <View style={styles.profile}>
            <View style={styles.avatar}>
              <Text style={styles.initial}>{me.data.username.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.lines}>
              <Text style={styles.name} numberOfLines={1}>
                {me.data.username}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {me.data.email}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Currency</Text>
          <Text style={styles.rowValue}>RSD</Text>
        </View>
        <Text style={styles.note}>EUR and USD arrive with multi-currency.</Text>
      </View>

      <Button
        label="Log out"
        loadingLabel="Logging out…"
        variant="secondary"
        loading={logout.isPending}
        onPress={() => logout.mutate()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  content: { paddingHorizontal: spacing.gutter, gap: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 20,
    boxShadow: shadows.card,
    gap: 6,
  },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { ...type.title, color: colors.accentText },
  lines: { flex: 1, gap: 6 },
  name: { ...type.headline, color: colors.ink },
  email: { ...type.caption, color: colors.ink2 },
  skeleton: { backgroundColor: colors.muted, borderRadius: radii.tile },
  lineWide: { height: 16, width: '60%' },
  lineNarrow: { height: 12, width: '80%' },
  errorBlock: { alignItems: 'flex-start', gap: 4 },
  errorText: { ...type.body, color: colors.ink },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { ...type.headline, color: colors.ink },
  rowValue: { ...type.headline, color: colors.ink2 },
  note: { ...type.caption, color: colors.ink2 },
});
