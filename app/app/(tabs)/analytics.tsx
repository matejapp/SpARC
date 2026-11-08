import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnalyticsCard } from '@/components/analytics/AnalyticsCard';
import { CategoriesCard } from '@/components/analytics/CategoriesCard';
import { CategoryMonthsCard } from '@/components/analytics/CategoryMonthsCard';
import { DailyCard } from '@/components/analytics/DailyCard';
import { EmptyPeriod } from '@/components/analytics/EmptyPeriod';
import { HeadlineCard } from '@/components/analytics/HeadlineCard';
import { PaceCard } from '@/components/analytics/PaceCard';
import { PeriodPicker } from '@/components/analytics/PeriodPicker';
import { TrendCard } from '@/components/analytics/TrendCard';
import { BrandArc } from '@/components/BrandArc';
import { ChevronIcon } from '@/components/icons';
import { ErrorBanner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import {
  useAnalyticsCategories,
  useAnalyticsCategoryMonths,
  useAnalyticsDaily,
  useAnalyticsPace,
  useAnalyticsSummary,
  useAnalyticsTrend,
} from '@/hooks/useAnalytics';
import { useMe } from '@/hooks/useMe';
import { chartMonths, periodAt, type PeriodKind } from '@/lib/periods';
import { makeStyles, radii, spacing, type, useTheme } from '@/lib/theme';
import type { TransactionType } from '@/types/api';

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
] as const satisfies readonly { value: TransactionType; label: string }[];

// The Analytics tab (F-04.3 – F-04.5, F-04.8 – F-04.14; board → Analytics tab). Every amount
// is in the display currency, which the chip in the header shows and opens in settings. Each
// card is its own query, so each loads and fails on its own.
export default function AnalyticsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const me = useMe();
  const currency = me.data?.preferredCurrency;

  const [kind, setKind] = useState<PeriodKind>('month');
  const [offset, setOffset] = useState(0);
  const period = useMemo(() => periodAt(kind, offset), [kind, offset]);
  const months = useMemo(() => chartMonths(period), [period]);

  // Hooks run on every render, in the same order, so the queries are made here and the cards
  // below only read them.
  const summary = useAnalyticsSummary(period);
  const trend = useAnalyticsTrend(months);
  const [categoryType, setCategoryType] = useState<TransactionType>('expense');
  const categories = useAnalyticsCategories(period, categoryType);
  const categoryMonths = useAnalyticsCategoryMonths(months);
  const empty = summary.data !== undefined && summary.data.current.income === 0 && summary.data.current.expense === 0;

  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['analytics'] });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.ink2} />}
    >
      <BrandArc />
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Analytics
        </Text>
        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel={currency ? `Display currency: ${currency}. Change in settings` : 'Display currency settings'}
          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
        >
          <Text style={styles.chipText}>{currency ?? '···'}</Text>
          <ChevronIcon color={colors.ink2} size={14} down />
        </Pressable>
      </View>

      <PeriodPicker
        period={period}
        onKind={(next) => {
          setKind(next);
          setOffset(0);
        }}
        onStep={(by) => setOffset((o) => Math.min(0, o + by))}
      />

      {empty ? (
        <EmptyPeriod period={period} onPrevious={() => setOffset((o) => o - 1)} />
      ) : (
        <>
          {summary.data ? (
            <HeadlineCard summary={summary.data} period={period} />
          ) : summary.isError ? (
            <View style={styles.headlineState}>
              <ErrorBanner message={`The numbers for ${period.title} didn't load. ${summary.error.message}`} />
              <View style={styles.retry}>
                <Button label="Try again" variant="secondary" onPress={() => summary.refetch()} />
              </View>
            </View>
          ) : (
            <View
              accessible
              accessibilityLabel="Loading the headline numbers"
              accessibilityState={{ busy: true }}
              style={[styles.headlineState, styles.headlineSkeleton]}
            />
          )}

          <AnalyticsCard
            title="Income and expense"
            aside={period.kind === 'year' ? 'By month' : '6 months'}
            query={trend}
          >
            {(data) => <TrendCard trend={data} />}
          </AnalyticsCard>

          {period.month ? <PaceSection month={period.month} /> : null}

          <AnalyticsCard
            title="By category"
            action={
              <View style={styles.typeSwitch}>
                <SegmentedControl label="Type" options={TYPE_OPTIONS} value={categoryType} onChange={setCategoryType} />
              </View>
            }
            query={categories}
            skeletonHeight={320}
          >
            {(data) => <CategoriesCard data={data} period={period} />}
          </AnalyticsCard>

          <AnalyticsCard title="Categories over time" aside="Top 5 and other" query={categoryMonths} skeletonHeight={300}>
            {(data) => <CategoryMonthsCard data={data} />}
          </AnalyticsCard>

          {period.month ? (
            <DailySection month={period.month} averagePerDay={summary.data?.current.averageDailySpend ?? null} />
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

// The month-only cards: their endpoints take one month (D-042).
function PaceSection({ month }: { month: string }) {
  return (
    <AnalyticsCard title="Spending pace" query={useAnalyticsPace(month)}>
      {(pace) => <PaceCard pace={pace} />}
    </AnalyticsCard>
  );
}

function DailySection({ month, averagePerDay }: { month: string; averagePerDay: number | null }) {
  return (
    <AnalyticsCard title="Daily spending" query={useAnalyticsDaily(month)} skeletonHeight={170}>
      {(daily) => <DailyCard data={daily} averagePerDay={averagePerDay} />}
    </AnalyticsCard>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.ground },
  content: { paddingHorizontal: spacing.gutter, paddingBottom: 24, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  title: { ...type.screenTitle, color: t.colors.ink },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: t.colors.surface,
    boxShadow: t.shadows.outline,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pressed: { opacity: 0.7 },
  chipText: { ...type.buttonSmall, color: t.colors.ink, letterSpacing: 0.8 },
  headlineState: { borderRadius: radii.card, backgroundColor: t.colors.surface, boxShadow: t.shadows.card, padding: 20, gap: 12 },
  headlineSkeleton: { height: 230 },
  retry: { alignSelf: 'flex-start' },
  typeSwitch: { width: 200 },
}));
