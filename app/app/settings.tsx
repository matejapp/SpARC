import { useMutation } from '@tanstack/react-query';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { signOut } from '@/api/auth';
import { ApiError } from '@/api/client';
import { BrandArc } from '@/components/BrandArc';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ErrorBanner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useMe, useUpdateMe } from '@/hooks/useMe';
import type { Currency } from '@/types/api';
import { clearSession } from '@/lib/session';
import { makeStyles, radii, setThemeMode, spacing, type, useThemeMode } from '@/lib/theme';

// Profile and settings, opened from the avatar on the dashboard and the currency chip on
// Analytics: the account, the theme, the display currency and logout.
const THEME_OPTIONS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
] as const;

const CURRENCY_OPTIONS = [
  { value: 'RSD', label: 'RSD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
] as const satisfies readonly { value: Currency; label: string }[];

function saveErrorMessage(e: Error): string {
  if (e instanceof ApiError && e.status === 0) return "Couldn't reach the server, so the currency wasn't changed.";
  return e.message || "The currency wasn't changed. Try again.";
}

export default function SettingsScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const me = useMe();
  const themeMode = useThemeMode();
  const updateMe = useUpdateMe();
  const currencyShown = updateMe.isPending
    ? updateMe.variables.preferredCurrency
    : (me.data?.preferredCurrency ?? 'RSD');

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
      <BrandArc />
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

      {/* The theme is this phone's preference, saved on the phone; it switches at once (D-033). */}
      <View style={[styles.card, styles.cardRoomy]}>
        <Text style={styles.rowLabel}>Theme</Text>
        <SegmentedControl
          label="Theme"
          options={THEME_OPTIONS}
          value={themeMode}
          onChange={setThemeMode}
        />
      </View>

      {/* The display currency is account data, saved on the server (D-043). While a save is in
          flight the control shows the chosen value; a failure snaps it back and says why. */}
      <View style={[styles.card, styles.cardRoomy]}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Display currency</Text>
          {updateMe.isPending ? <Text style={styles.note}>Saving…</Text> : null}
        </View>
        {me.data ? (
          <>
            <SegmentedControl
              label="Display currency"
              options={CURRENCY_OPTIONS}
              value={updateMe.isPending ? updateMe.variables.preferredCurrency : me.data.preferredCurrency}
              onChange={(preferredCurrency) => {
                // One save at a time, so two quick taps can't land on the server out of order.
                if (updateMe.isPending || preferredCurrency === me.data.preferredCurrency) return;
                updateMe.mutate({ preferredCurrency });
              }}
            />
            {updateMe.isError ? <ErrorBanner message={saveErrorMessage(updateMe.error)} /> : null}
            <Text style={styles.note}>
              Totals and charts show in {currencyShown}. Each amount converts at the NBS rate of its own
              date. Your entries keep the currency you typed them in.
            </Text>
          </>
        ) : (
          <View accessibilityLabel="Loading your settings" style={[styles.skeleton, styles.segmentSkeleton]} />
        )}
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

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.ground },
  content: { paddingHorizontal: spacing.gutter, gap: 16 },
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: radii.card,
    padding: 20,
    boxShadow: t.shadows.card,
    gap: 6,
  },
  cardRoomy: { gap: 12 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: t.colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { ...type.title, color: t.colors.accentText },
  lines: { flex: 1, gap: 6 },
  name: { ...type.headline, color: t.colors.ink },
  email: { ...type.caption, color: t.colors.ink2 },
  skeleton: { backgroundColor: t.colors.muted, borderRadius: radii.tile },
  lineWide: { height: 16, width: '60%' },
  lineNarrow: { height: 12, width: '80%' },
  errorBlock: { alignItems: 'flex-start', gap: 4 },
  errorText: { ...type.body, color: t.colors.ink },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { ...type.headline, color: t.colors.ink },
  segmentSkeleton: { height: 52, borderRadius: radii.pill },
  note: { ...type.caption, color: t.colors.ink2 },
}));
