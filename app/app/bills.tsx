import { router } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryIcon } from '@/components/CategoryIcon';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { RowsSkeleton } from '@/components/ui/Skeleton';
import { flattenBills, useBillList } from '@/hooks/useBills';
import { dueDay, todayIso } from '@/lib/dates';
import { formatAmount, formatMoney } from '@/lib/money';
import { makeStyles, radii, spacing, tabularNums, type, useTheme } from '@/lib/theme';
import type { BillResponse } from '@/types/api';

function BillRow({ bill, today, divider }: { bill: BillResponse; today: string; divider: boolean }) {
  const styles = useStyles();
  const { categoryTone } = useTheme();
  const tone = categoryTone(bill.categoryName, 'expense');
  const overdue = bill.nextDueDate !== null && bill.nextDueDate < today;
  const due = bill.nextDueDate
    ? overdue
      ? `Overdue since ${dueDay(bill.nextDueDate, today)}`
      : `Due ${dueDay(bill.nextDueDate, today)}`
    : 'Nothing left to pay';
  const caption = `${due} · ${bill.monthly ? 'monthly' : 'once'}`;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/bill/[id]', params: { id: bill.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${bill.name}, ${caption}, ${formatAmount(bill.amount)} ${bill.currency}`}
      accessibilityHint="Opens the bill"
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.pressed]}
    >
      <View style={[styles.tile, { backgroundColor: tone.tint }]}>
        <CategoryIcon name={bill.categoryName} color={tone.ink} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {bill.name}
        </Text>
        <Text style={[styles.caption, overdue && styles.overdue]} numberOfLines={1}>
          {caption}
        </Text>
      </View>
      {/* RSD rows leave the code out, as transaction rows do; other currencies show it. */}
      <Text style={styles.amount}>
        {bill.currency === 'RSD' ? formatAmount(bill.amount) : formatMoney(bill.amount, bill.currency)}
      </Text>
    </Pressable>
  );
}

// Every active bill, by name (F-05.3), reached from the Calendar tab. Not drawn on the board —
// derived from Transactions. Each row opens the bill.
export default function BillsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const list = useBillList();
  const bills = useMemo(() => flattenBills(list.data), [list.data]);
  const today = todayIso();

  let body: ReactNode = null;
  if (list.isPending) {
    body = <RowsSkeleton label="Loading bills" />;
  } else if (list.isError && !list.data) {
    body = (
      <View style={[styles.card, styles.message]}>
        <Text style={styles.messageTitle}>Bills didn't load</Text>
        <Text style={styles.messageText}>{list.error.message}</Text>
        <Button label="Try again" variant="secondary" onPress={() => list.refetch()} />
      </View>
    );
  } else if (bills.length === 0) {
    body = (
      <View style={[styles.card, styles.message]}>
        <Text style={styles.messageTitle}>No bills yet</Text>
        <Text style={styles.messageText}>
          Add rent, internet or anything you pay on a schedule, and SpARC tracks each month.
        </Text>
        <Button label="Add your first bill" onPress={() => router.push('/bill/new')} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 16) + 20 },
      ]}
      data={body ? [] : [bills]}
      keyExtractor={() => 'bills'}
      ListHeaderComponent={
        <View style={styles.header}>
          <ScreenHeader title="Bills" />
          {body ? null : <Button label="Add bill" variant="secondary" onPress={() => router.push('/bill/new')} />}
          {body}
        </View>
      }
      // One card holding every row, as Transactions groups a day.
      renderItem={({ item }) => (
        <View style={[styles.card, styles.rows]}>
          {item.map((bill, i) => (
            <BillRow key={bill.id} bill={bill} today={today} divider={i > 0} />
          ))}
        </View>
      )}
      ListFooterComponent={
        list.hasNextPage ? (
          <View style={styles.footer}>
            {list.isFetchNextPageError ? <Text style={styles.footerError}>More bills didn't load.</Text> : null}
            <Button
              label={list.isFetchNextPageError ? 'Try again' : 'Load more'}
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
  content: { paddingHorizontal: spacing.gutter, gap: 16 },
  header: { gap: 16 },
  card: { backgroundColor: t.colors.surface, borderRadius: radii.card, boxShadow: t.shadows.card },
  rows: { paddingVertical: 4, paddingHorizontal: 16 },
  message: { padding: 20, gap: 12 },
  messageTitle: { ...type.headline, color: t.colors.ink },
  messageText: { ...type.body, color: t.colors.ink2 },
  row: { height: 68, flexDirection: 'row', alignItems: 'center', gap: 14 },
  divider: { boxShadow: t.shadows.divider },
  pressed: { opacity: 0.6 },
  tile: { width: 44, height: 44, borderRadius: radii.tile, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0 },
  title: { ...type.rowTitle, color: t.colors.ink },
  caption: { ...type.caption, color: t.colors.ink2 },
  overdue: { color: t.colors.error },
  amount: { ...type.rowAmount, ...tabularNums, color: t.colors.ink },
  footer: { gap: 8 },
  footerError: { ...type.caption, color: t.colors.error, textAlign: 'center' },
}));
