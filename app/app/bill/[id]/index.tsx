import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { CategoryIcon } from '@/components/CategoryIcon';
import { OccurrenceRow, occurrenceState } from '@/components/OccurrenceRow';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { RowsSkeleton } from '@/components/ui/Skeleton';
import { useBill, useBillOccurrences, useDeactivateBill, usePayOccurrence } from '@/hooks/useBills';
import { dateLabel, dayOrdinal, dueDay, monthName, todayIso } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { makeStyles, radii, spacing, tabularNums, type, useTheme } from '@/lib/theme';
import type { BillResponse, OccurrenceResponse } from '@/types/api';

type Panel = 'toPay' | 'paid';

function nextDueText(bill: BillResponse, today: string): { text: string; overdue: boolean } {
  if (!bill.nextDueDate) return { text: 'Nothing left to pay', overdue: false };
  if (bill.nextDueDate < today) return { text: `Overdue since ${dueDay(bill.nextDueDate, today)}`, overdue: true };
  return { text: `Next due ${dueDay(bill.nextDueDate, today)}`, overdue: false };
}

// One bill (not drawn on the board — derived from transaction detail and Transactions): the
// bill, its months with Mark paid, Edit, and Delete, which deactivates. Reached from the bill
// list and the calendar; a reminder will open it too. The id is only a lookup key: another
// user's bill is the API's 404, shown as a not-found state.
export default function BillScreen() {
  const styles = useStyles();
  const { categoryTone, colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const bill = useBill(id);
  const months = useBillOccurrences(id);
  const pay = usePayOccurrence();
  const deactivate = useDeactivateBill(id);
  const [panel, setPanel] = useState<Panel>('toPay');
  const today = todayIso();
  const padding = { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 16) + 20 };

  if (!bill.data) {
    const gone = bill.error instanceof ApiError && bill.error.status === 404;
    return (
      <View style={[styles.screen, styles.content, padding]}>
        <ScreenHeader title="Bill" />
        {bill.isPending ? (
          <RowsSkeleton rows={3} label="Loading the bill" />
        ) : (
          <View style={[styles.card, styles.message]}>
            <Text style={styles.messageTitle}>{gone ? 'This bill no longer exists' : "This bill didn't load"}</Text>
            <Text style={styles.messageText}>{gone ? 'It may have been deleted.' : bill.error?.message}</Text>
            {gone ? (
              <Button label="Back" variant="secondary" onPress={() => router.back()} />
            ) : (
              <Button label="Try again" variant="secondary" onPress={() => bill.refetch()} />
            )}
          </View>
        )}
      </View>
    );
  }

  const b = bill.data;
  const tone = categoryTone(b.categoryName, 'expense');
  const next = nextDueText(b, today);

  function confirmPay(o: OccurrenceResponse) {
    Alert.alert(
      `Mark ${monthName(o.dueDate)} paid?`,
      `Adds a ${formatMoney(o.amount, o.currency)} expense dated today` +
        (o.currency === 'RSD' ? '' : ", at today's NBS rate") +
        '. You can edit it afterwards.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark paid',
          onPress: () =>
            pay.mutate(
              { id: o.id },
              {
                onError: (e) => {
                  // Already paid (another tap, another phone): the refreshed list shows it.
                  if (!(e instanceof ApiError && e.status === 409)) Alert.alert("Couldn't mark it paid", e.message);
                },
              },
            ),
        },
      ],
    );
  }

  function confirmDeactivate() {
    Alert.alert(
      'Delete this bill?',
      "Its upcoming months disappear. Months you've paid, and their expenses, stay.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deactivate.mutate(undefined, {
              onSuccess: () => router.back(),
              onError: (e) => Alert.alert("Couldn't delete", e.message),
            }),
        },
      ],
    );
  }

  function monthRows(rows: OccurrenceResponse[]) {
    return (
      <View style={[styles.card, styles.rows]}>
        {rows.map((o, i) => {
          const state = occurrenceState(o, today);
          const paying = pay.isPending && pay.variables?.id === o.id;
          return (
            <OccurrenceRow
              key={o.id}
              occurrence={o}
              title={dateLabel(o.dueDate, today)}
              caption={state === 'paid' ? 'Paid · opens the expense' : state === 'overdue' ? 'Overdue' : 'Due'}
              state={state}
              divider={i > 0}
              onPress={
                o.transactionId
                  ? () => router.push({ pathname: '/transaction/[id]', params: { id: o.transactionId! } })
                  : undefined
              }
              hint={o.transactionId ? 'Opens the expense' : undefined}
              action={
                o.status === 'pending' ? (
                  <Button
                    label="Mark paid"
                    variant="secondary"
                    loading={paying}
                    loadingLabel="Saving…"
                    disabled={pay.isPending && !paying}
                    onPress={() => confirmPay(o)}
                  />
                ) : undefined
              }
            />
          );
        })}
      </View>
    );
  }

  let monthsBody;
  if (months.isPending) {
    monthsBody = <RowsSkeleton rows={3} label="Loading the months" />;
  } else if (months.isError && !months.data) {
    monthsBody = (
      <View style={[styles.card, styles.message]}>
        <Text style={styles.messageText}>The months didn't load. {months.error.message}</Text>
        <Button label="Try again" variant="secondary" onPress={() => months.refetch()} />
      </View>
    );
  } else {
    // Both lists by due date, soonest first (the API's order); an overdue month is the earliest
    // unpaid one, so it leads To pay.
    const rows = months.data.filter((o) => (panel === 'paid' ? o.status === 'paid' : o.status === 'pending'));
    monthsBody =
      rows.length > 0 ? (
        monthRows(rows)
      ) : (
        <View style={[styles.card, styles.message]}>
          <Text style={styles.messageText}>{panel === 'paid' ? 'Nothing paid yet.' : 'Nothing left to pay.'}</Text>
        </View>
      );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, padding]}
      refreshControl={
        <RefreshControl
          refreshing={bill.isRefetching || months.isRefetching}
          onRefresh={() => {
            bill.refetch();
            months.refetch();
          }}
          tintColor={colors.ink2}
        />
      }
    >
      <ScreenHeader title="Bill" />

      <View style={[styles.card, styles.summary]}>
        <View style={styles.summaryTop}>
          <View style={[styles.tile, { backgroundColor: tone.tint }]}>
            <CategoryIcon name={b.categoryName} color={tone.ink} size={24} />
          </View>
          <View style={styles.summaryText}>
            <Text style={styles.name} numberOfLines={2}>
              {b.name}
            </Text>
            <Text style={styles.caption}>{b.categoryName ?? 'No category'}</Text>
          </View>
        </View>
        <Text style={styles.amount}>{formatMoney(b.amount, b.currency)}</Text>
        <Text style={styles.caption}>{b.monthly ? `Every month, on the ${dayOrdinal(b.firstDueDate)}` : 'Once'}</Text>
        <Text style={[styles.next, next.overdue && styles.overdue]}>{next.text}</Text>
        <Button
          label="Edit bill"
          variant="secondary"
          onPress={() => router.push({ pathname: '/bill/[id]/edit', params: { id: b.id } })}
        />
      </View>

      <SegmentedControl
        label="Months"
        options={[
          { value: 'toPay', label: 'To pay' },
          { value: 'paid', label: 'Paid' },
        ]}
        value={panel}
        onChange={setPanel}
      />
      {monthsBody}

      <Button
        label="Delete bill"
        variant="danger"
        loading={deactivate.isPending}
        loadingLabel="Deleting…"
        onPress={confirmDeactivate}
      />
    </ScrollView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.ground },
  content: { paddingHorizontal: spacing.gutter, gap: 16 },
  card: { backgroundColor: t.colors.surface, borderRadius: radii.card, boxShadow: t.shadows.card },
  message: { padding: 20, gap: 12 },
  messageTitle: { ...type.headline, color: t.colors.ink },
  messageText: { ...type.body, color: t.colors.ink2 },
  summary: { padding: 20, gap: 6 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  tile: { width: 52, height: 52, borderRadius: radii.tile, alignItems: 'center', justifyContent: 'center' },
  summaryText: { flex: 1, minWidth: 0, gap: 2 },
  name: { ...type.title, color: t.colors.ink },
  caption: { ...type.caption, color: t.colors.ink2 },
  amount: { ...type.cardAmount, ...tabularNums, color: t.colors.ink },
  next: { ...type.headline, color: t.colors.ink, marginBottom: 10 },
  overdue: { color: t.colors.error },
  rows: { paddingHorizontal: 16, paddingVertical: 4 },
}));
