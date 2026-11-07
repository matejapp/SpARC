import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityFilters } from '@/components/ActivityFilters';
import { BrandArc } from '@/components/BrandArc';
import { BackIcon } from '@/components/icons';
import { TransactionRow } from '@/components/TransactionRow';
import { Button } from '@/components/ui/Button';
import { RowsSkeleton } from '@/components/ui/Skeleton';
import { flattenPages, useTransactionList } from '@/hooks/useTransactions';
import { dayHeading } from '@/lib/dates';
import { makeStyles, radii, spacing, tabularNums, type, useTheme } from '@/lib/theme';
import { hasAnyFilter, parseFilters, toParams, type TransactionFilters } from '@/lib/transactionFilters';
import type { TransactionResponse } from '@/types/api';

type Day = { date: string; items: TransactionResponse[] };

// Rows arrive newest first, so a day's rows are contiguous.
function byDay(rows: TransactionResponse[]): Day[] {
  const days: Day[] = [];
  for (const row of rows) {
    const last = days[days.length - 1];
    if (last?.date === row.occurredOn) last.items.push(row);
    else days.push({ date: row.occurredOn, items: [row] });
  }
  return days;
}

// The Activity tab (board → Transactions): every transaction, grouped by day, in cards.
// FlatList renders only what is near the screen, so a long history stays cheap to scroll.
//
// The filters live in the route's search params — the `?type=expense&currency=EUR` part of the
// screen's URL, which expo-router keeps for every screen like a web address. Reading them with
// useLocalSearchParams and writing them with router.setParams (instead of useState) means the
// filters survive leaving the tab and coming back, and a link can open Activity pre-filtered.
// setParams re-renders this screen with the new params; nothing is pushed onto the back stack.
export default function TransactionsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const filters = useMemo(() => parseFilters(params), [params]);
  const filtered = hasAnyFilter(filters);
  const setFilters = (next: TransactionFilters) => router.setParams(toParams(next));
  // One cache entry per combination; switching back to one already seen shows it at once.
  const list = useTransactionList(filters);
  const days = useMemo(() => byDay(flattenPages(list.data)), [list.data]);
  const total = list.data?.pages[0]?.totalCount;

  const header = (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.navigate('/')}
        accessibilityRole="button"
        accessibilityLabel="Back to dashboard"
        style={styles.back}
      >
        <BackIcon color={colors.ink} />
      </Pressable>
      <View style={styles.headerText}>
        <Text accessibilityRole="header" style={styles.title}>
          Transactions
        </Text>
        {total !== undefined && total > 0 ? (
          <Text style={styles.subtitle}>
            {total} {filtered ? 'matching' : 'total'} · newest first
          </Text>
        ) : null}
      </View>
    </View>
  );

  let body: ReactNode = null;
  if (list.isPending) {
    body = (
      <View style={styles.state}>
        <View style={styles.headingSkeleton} />
        <RowsSkeleton label="Loading transactions" />
      </View>
    );
  } else if (list.isError && !list.data) {
    // Only when nothing is loaded: a failed pull-to-refresh keeps the rows already on screen.
    body = (
      <View style={[styles.card, styles.state, styles.message]}>
        <Text style={styles.messageTitle}>Transactions didn't load</Text>
        <Text style={styles.messageText}>{list.error.message}</Text>
        <Button label="Try again" variant="secondary" onPress={() => list.refetch()} />
      </View>
    );
  } else if (days.length === 0 && filtered) {
    body = (
      <View style={[styles.card, styles.state, styles.message]}>
        <Text style={styles.messageTitle}>Nothing matches these filters</Text>
        <Text style={styles.messageText}>Try a wider period, or clear the filters to see everything.</Text>
        <Button label="Clear all filters" variant="secondary" onPress={() => setFilters({})} />
      </View>
    );
  } else if (days.length === 0) {
    body = (
      <View style={[styles.card, styles.state, styles.message]}>
        <Text style={styles.messageTitle}>No transactions yet</Text>
        <Text style={styles.messageText}>Everything you record shows up here, newest first.</Text>
        <Button label="Add transaction" onPress={() => router.push('/add')} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      data={body ? [] : days}
      keyExtractor={(day) => day.date}
      ListHeaderComponent={
        <>
          <BrandArc />
          {header}
          <ActivityFilters filters={filters} onChange={setFilters} />
          {body}
        </>
      }
      renderItem={({ item: day }) => (
        <View style={styles.day}>
          <Text style={styles.dayHeading} accessibilityRole="header">
            {dayHeading(day.date)}
          </Text>
          <View style={[styles.card, styles.rows]}>
            {day.items.map((t, i) => (
              <TransactionRow
                key={t.id}
                item={t}
                caption={t.categoryName ?? 'No category'}
                divider={i > 0}
                onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: t.id } })}
              />
            ))}
          </View>
        </View>
      )}
      ListFooterComponent={
        list.hasNextPage ? (
          <View style={styles.footer}>
            {list.isFetchNextPageError ? (
              <Text style={styles.footerError}>Older transactions didn't load.</Text>
            ) : null}
            <Button
              label={list.isFetchNextPageError ? 'Try again' : 'Load older'}
              variant="quiet"
              loading={list.isFetchingNextPage}
              loadingLabel="Loading…"
              onPress={() => list.fetchNextPage()}
            />
          </View>
        ) : undefined
      }
      refreshControl={
        <RefreshControl
          refreshing={list.isRefetching && !list.isFetchingNextPage}
          onRefresh={() => {
            list.refetch();
          }}
          tintColor={colors.ink2}
        />
      }
    />
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.ground },
  content: { paddingHorizontal: spacing.gutter, paddingBottom: 24, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 2 },
  back: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: t.colors.surface,
    boxShadow: t.shadows.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { ...type.screenTitle, color: t.colors.ink },
  subtitle: { ...type.caption, ...tabularNums, color: t.colors.ink2, marginTop: 2 },
  state: { marginTop: 20, gap: 10 },
  headingSkeleton: { height: 12, width: 70, borderRadius: 6, backgroundColor: t.colors.muted, marginHorizontal: 4 },
  card: { backgroundColor: t.colors.surface, borderRadius: radii.card, boxShadow: t.shadows.card },
  rows: { paddingVertical: 4, paddingHorizontal: 16 },
  message: { padding: 20, gap: 12, alignItems: 'stretch' },
  messageTitle: { ...type.headline, color: t.colors.ink },
  messageText: { ...type.body, color: t.colors.ink2 },
  day: { gap: 8 },
  dayHeading: { ...type.dayHeading, color: t.colors.ink2, marginHorizontal: 4 },
  footer: { gap: 8 },
  footerError: { ...type.caption, color: t.colors.error, textAlign: 'center' },
}));
