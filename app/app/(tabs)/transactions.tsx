import { router } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackIcon } from '@/components/icons';
import { TransactionRow } from '@/components/TransactionRow';
import { Button } from '@/components/ui/Button';
import { RowsSkeleton } from '@/components/ui/Skeleton';
import { flattenPages, useTransactionList } from '@/hooks/useTransactions';
import { dayHeading } from '@/lib/dates';
import { colors, radii, shadows, spacing, tabularNums, type } from '@/lib/theme';
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

// The Activity tab (board → Transactions): every transaction, grouped by day, in white cards.
// FlatList renders only what is near the screen, so a long history stays cheap to scroll.
export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const list = useTransactionList();
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
          <Text style={styles.subtitle}>{total} total · newest first</Text>
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
          {header}
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  content: { paddingHorizontal: spacing.gutter, paddingBottom: 24, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 2 },
  back: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    boxShadow: shadows.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { ...type.screenTitle, color: colors.ink },
  subtitle: { ...type.caption, ...tabularNums, color: colors.ink2, marginTop: 2 },
  state: { marginTop: 20, gap: 10 },
  headingSkeleton: { height: 12, width: 70, borderRadius: 6, backgroundColor: colors.muted, marginHorizontal: 4 },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, boxShadow: shadows.card },
  rows: { paddingVertical: 4, paddingHorizontal: 16 },
  message: { padding: 20, gap: 12, alignItems: 'stretch' },
  messageTitle: { ...type.headline, color: colors.ink },
  messageText: { ...type.body, color: colors.ink2 },
  day: { gap: 8 },
  dayHeading: { ...type.dayHeading, color: colors.ink2, marginHorizontal: 4 },
  footer: { gap: 8 },
  footerError: { ...type.caption, color: colors.error, textAlign: 'center' },
});
