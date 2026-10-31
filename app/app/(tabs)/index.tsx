import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MinusIcon, PlusIcon, WalletIcon } from '@/components/icons';
import { MonthCard } from '@/components/MonthCard';
import { TransactionRow } from '@/components/TransactionRow';
import { Button } from '@/components/ui/Button';
import { RowsSkeleton } from '@/components/ui/Skeleton';
import { useSummary } from '@/hooks/useDashboard';
import { useMe } from '@/hooks/useMe';
import { flattenPages, useTransactionList } from '@/hooks/useTransactions';
import { currentMonth, shortDay } from '@/lib/dates';
import { colors, radii, shadows, spacing, type } from '@/lib/theme';

const RECENT = 4;

// Home (board → Dashboard, and first-run Dashboard when nothing is recorded yet): the greeting,
// this month's card, quick Expense / Income buttons and the latest transactions. Recent rows
// come from the same cached query as the Activity tab, so neither screen fetches twice.
export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const month = currentMonth();
  const me = useMe();
  const summary = useSummary(month.from, month.to);
  const list = useTransactionList();

  const recent = useMemo(() => flattenPages(list.data).slice(0, RECENT), [list.data]);
  const firstRun = list.data?.pages[0]?.totalCount === 0;
  const name = me.data?.username;

  function refresh() {
    me.refetch();
    summary.refetch();
    list.refetch();
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      refreshControl={
        <RefreshControl
          refreshing={summary.isRefetching && !summary.isPending}
          onRefresh={refresh}
          tintColor={colors.ink2}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.greeting}>
          <Text style={styles.greetingLabel}>{firstRun ? 'Welcome' : 'Welcome back'}</Text>
          {name ? (
            <Text accessibilityRole="header" style={styles.name} numberOfLines={1}>
              {name}
            </Text>
          ) : me.isPending ? (
            <View style={styles.nameSkeleton} />
          ) : null}
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Profile and settings"
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{name ? name.charAt(0).toUpperCase() : '·'}</Text>
        </Pressable>
      </View>

      {summary.isError && !summary.data ? (
        <View style={[styles.card, styles.message]}>
          <Text style={styles.messageTitle}>This month's totals didn't load</Text>
          <Text style={styles.messageText}>{summary.error.message}</Text>
          <Button label="Try again" variant="secondary" onPress={() => summary.refetch()} />
        </View>
      ) : (
        <MonthCard code={month.label} summary={summary.data} />
      )}

      {firstRun ? (
        <View style={[styles.card, styles.firstRun]}>
          <View style={styles.firstRunIcon}>
            <WalletIcon color={colors.accentText} />
          </View>
          <Text style={styles.firstRunTitle}>No transactions yet</Text>
          <Text style={styles.firstRunText}>
            Add your first expense or income and this month's card fills in.
          </Text>
          <Button label="Add first transaction" onPress={() => router.push('/add')} />
        </View>
      ) : (
        <>
          <View style={styles.quick}>
            <Pressable
              onPress={() => router.push({ pathname: '/add', params: { type: 'expense' } })}
              accessibilityRole="button"
              accessibilityLabel="Add expense"
              style={({ pressed }) => [styles.quickButton, styles.quickExpense, pressed && styles.pressed]}
            >
              <MinusIcon color={colors.onPrimary} />
              <Text style={[styles.quickLabel, { color: colors.onPrimary }]}>Expense</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push({ pathname: '/add', params: { type: 'income' } })}
              accessibilityRole="button"
              accessibilityLabel="Add income"
              style={({ pressed }) => [styles.quickButton, styles.quickIncome, pressed && styles.pressed]}
            >
              <PlusIcon color={colors.income} size={18} />
              <Text style={[styles.quickLabel, { color: colors.ink }]}>Income</Text>
            </Pressable>
          </View>

          <View style={styles.recent}>
            <View style={styles.recentHeader}>
              <Text accessibilityRole="header" style={styles.recentTitle}>
                Recent
              </Text>
              <Button label="See all" variant="link" onPress={() => router.navigate('/transactions')} />
            </View>
            {list.isPending ? (
              <RowsSkeleton rows={3} label="Loading recent transactions" />
            ) : list.isError && !list.data ? (
              <View style={[styles.card, styles.message]}>
                <Text style={styles.messageText}>Recent transactions didn't load.</Text>
                <Button label="Try again" variant="secondary" onPress={() => list.refetch()} />
              </View>
            ) : (
              <View style={[styles.card, styles.rows]}>
                {recent.map((t, i) => (
                  <TransactionRow
                    key={t.id}
                    item={t}
                    caption={`${t.categoryName ?? 'No category'} · ${shortDay(t.occurredOn)}`}
                    divider={i > 0}
                    onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: t.id } })}
                  />
                ))}
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  content: { paddingHorizontal: spacing.gutter, paddingBottom: 28, gap: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  greeting: { flex: 1 },
  greetingLabel: { ...type.greetingLabel, color: colors.ink2 },
  name: { ...type.greetingName, color: colors.ink, marginTop: 2 },
  nameSkeleton: { height: 26, width: 140, borderRadius: 8, backgroundColor: colors.muted, marginTop: 4 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    boxShadow: shadows.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...type.avatar, color: colors.accentText },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, boxShadow: shadows.card },
  message: { padding: 20, gap: 12 },
  messageTitle: { ...type.headline, color: colors.ink },
  messageText: { ...type.body, color: colors.ink2 },
  firstRun: { paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center', gap: 8 },
  firstRunIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  firstRunTitle: { ...type.sectionTitle, color: colors.ink },
  firstRunText: { ...type.body, color: colors.ink2, textAlign: 'center', maxWidth: 260, marginBottom: 14 },
  quick: { flexDirection: 'row', gap: 12 },
  quickButton: {
    flex: 1,
    height: 52,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickExpense: { backgroundColor: colors.primary, boxShadow: shadows.primaryButton },
  quickIncome: { backgroundColor: colors.surface, boxShadow: shadows.outline },
  quickLabel: { ...type.buttonSmall },
  pressed: { opacity: 0.85 },
  recent: { gap: 8, marginTop: 8 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentTitle: { ...type.sectionTitle, color: colors.ink },
  rows: { paddingVertical: 6, paddingHorizontal: 16 },
});
