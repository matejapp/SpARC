import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandArc } from '@/components/BrandArc';
import { MonthGrid, type DayMarks } from '@/components/MonthGrid';
import { OccurrenceRow, occurrenceState, type OccurrenceState } from '@/components/OccurrenceRow';
import { ErrorBanner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { RowsSkeleton } from '@/components/ui/Skeleton';
import { useBillList, useMonthOccurrences } from '@/hooks/useBills';
import { dayHeading, dueDay, type Month, monthOf, monthSpan, shiftMonth, todayIso } from '@/lib/dates';
import { makeStyles, radii, spacing, type, useTheme } from '@/lib/theme';
import type { IsoDate } from '@/types/api';

const RANK: Record<OccurrenceState, number> = { overdue: 3, upcoming: 2, paid: 1 };

// The Calendar tab (F-05.4, F-05.5; D-028 planned it for Sprint 2). Not drawn on the board —
// derived from Transactions and Dashboard. A month of due dates; tapping a day lists its bills,
// and a bill opens its detail. It reads the API only, so it works with notifications denied
// (F-06.6).
export default function CalendarScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const today = todayIso();
  const [month, setMonth] = useState<Month>(() => monthOf());
  const [picked, setPicked] = useState<IsoDate | null>(today);
  const occurrences = useMonthOccurrences(month);
  const bills = useBillList(); // only to tell "no bills at all" from "nothing this month"
  const noBills = bills.data?.pages[0]?.totalCount === 0;

  const { from, to, title } = monthSpan(month);
  // The picked day only counts while its month is on screen.
  const selected = picked && picked >= from && picked <= to ? picked : null;

  const marks = useMemo(() => {
    const result: DayMarks = {};
    for (const o of occurrences.data ?? []) {
      const state = occurrenceState(o, today);
      if (!result[o.dueDate] || RANK[state] > RANK[result[o.dueDate]]) result[o.dueDate] = state;
    }
    return result;
  }, [occurrences.data, today]);

  const shown = (occurrences.data ?? []).filter((o) => (selected ? o.dueDate === selected : true));
  const monthName = title.split(' ')[0];

  let body;
  if (occurrences.isPending) {
    body = <RowsSkeleton rows={2} label="Loading bills" />;
  } else if (occurrences.isError && !occurrences.data) {
    body = (
      <View style={styles.state}>
        <ErrorBanner message={`Bills didn't load. ${occurrences.error.message}`} />
        <Button label="Try again" variant="secondary" onPress={() => occurrences.refetch()} />
      </View>
    );
  } else if (noBills) {
    body = (
      <View style={[styles.card, styles.message]}>
        <Text style={styles.messageTitle}>No bills yet</Text>
        <Text style={styles.messageText}>Add a bill and its due dates show up here, month by month.</Text>
        <Button label="Add your first bill" onPress={() => router.push('/bill/new')} />
      </View>
    );
  } else if (shown.length === 0) {
    body = (
      <View style={[styles.card, styles.message]}>
        <Text style={styles.messageText}>
          {selected ? 'Nothing due on this day.' : `Nothing due in ${monthName}.`}
        </Text>
        {selected ? <Button label={`Show all of ${monthName}`} variant="link" onPress={() => setPicked(null)} /> : null}
      </View>
    );
  } else {
    body = (
      <View style={[styles.card, styles.rows]}>
        {shown.map((o, i) => {
          const state = occurrenceState(o, today);
          return (
            <OccurrenceRow
              key={o.id}
              occurrence={o}
              title={o.billName}
              caption={state === 'overdue' ? `Overdue since ${dueDay(o.dueDate, today)}` : dueDay(o.dueDate, today)}
              state={state}
              divider={i > 0}
              onPress={() => router.push({ pathname: '/bill/[id]', params: { id: o.billId } })}
              hint="Opens the bill"
            />
          );
        })}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      refreshControl={
        <RefreshControl
          refreshing={occurrences.isRefetching}
          onRefresh={() => {
            occurrences.refetch();
            bills.refetch();
          }}
          tintColor={colors.ink2}
        />
      }
    >
      <BrandArc />
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Calendar
        </Text>
        <Button label="All bills" variant="link" onPress={() => router.push('/bills')} />
      </View>

      <MonthGrid
        month={month}
        marks={marks}
        selected={selected}
        today={today}
        onSelect={(day) => setPicked(day === selected ? null : day)}
        onShift={(by) => {
          setMonth((m) => shiftMonth(m, by));
          setPicked(null);
        }}
      />

      <View style={styles.list}>
        <Text style={styles.heading} accessibilityRole="header">
          {selected ? dayHeading(selected, today) : title.toUpperCase()}
        </Text>
        {body}
      </View>
    </ScrollView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.ground },
  content: { paddingHorizontal: spacing.gutter, paddingBottom: 24, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  title: { ...type.screenTitle, color: t.colors.ink },
  list: { gap: 8 },
  heading: { ...type.dayHeading, color: t.colors.ink2, marginHorizontal: 4 },
  state: { gap: 10 },
  card: { backgroundColor: t.colors.surface, borderRadius: radii.card, boxShadow: t.shadows.card },
  rows: { paddingHorizontal: 16, paddingVertical: 4 },
  message: { padding: 20, gap: 12, alignItems: 'stretch' },
  messageTitle: { ...type.headline, color: t.colors.ink },
  messageText: { ...type.body, color: t.colors.ink2 },
}));
