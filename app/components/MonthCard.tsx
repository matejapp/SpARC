import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { CardRings } from '@/components/CardRings';
import { Wordmark } from '@/components/Wordmark';
import { formatSigned, formatSignedAmount } from '@/lib/money';
import { colors, gradients, radii, shadows, tabularNums, type } from '@/lib/theme';
import type { DashboardSummaryResponse } from '@/types/api';

// The current month on the orange card (board → Dashboard, first-run Dashboard). The accent
// gradient is reserved for this card, the add button and the icon (D-027). Amounts on it are
// white: on orange, colour can't carry meaning, so the signs do.
export function MonthCard({
  code,
  summary,
}: {
  code: string; // "OCT 2026"
  summary: DashboardSummaryResponse | undefined; // undefined while loading
}) {
  const empty = summary !== undefined && summary.totalIncome === 0 && summary.totalExpense === 0;

  return (
    <LinearGradient
      {...gradients.accent}
      style={styles.card}
      accessible
      accessibilityLabel={
        summary
          ? `${code}. Left this month ${formatSignedAmount(summary.difference)} RSD. ` +
            `Income ${formatSigned(summary.totalIncome, 'income')}, expense ${formatSigned(summary.totalExpense, 'expense')}.`
          : `${code}. Loading this month's totals.`
      }
    >
      <CardRings />
      <View style={styles.top}>
        <Wordmark size={15} color={colors.onInk} />
        <Text style={styles.code}>{code}</Text>
      </View>

      <View>
        <Text style={styles.caption}>Left this month</Text>
        {summary ? (
          <Text style={styles.amount}>
            {formatSignedAmount(summary.difference)} <Text style={styles.currency}>RSD</Text>
          </Text>
        ) : (
          <View style={[styles.bar, styles.barAmount]} />
        )}
      </View>

      {!summary ? (
        <View style={styles.stats}>
          <View style={[styles.bar, styles.barStat]} />
          <View style={[styles.bar, styles.barStat]} />
        </View>
      ) : empty ? (
        <Text style={styles.caption}>Nothing recorded yet this month</Text>
      ) : (
        <View style={styles.stats}>
          <View>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={styles.statValue}>{formatSigned(summary.totalIncome, 'income')}</Text>
          </View>
          <View>
            <Text style={styles.statLabel}>Expense</Text>
            <Text style={styles.statValue}>{formatSigned(summary.totalExpense, 'expense')}</Text>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 200,
    borderRadius: radii.card,
    overflow: 'hidden',
    paddingVertical: 22,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    boxShadow: shadows.monthCard,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { ...type.cardCode, color: colors.onInk },
  caption: { ...type.cardCaption, color: colors.onCard },
  amount: { ...type.cardAmount, ...tabularNums, color: colors.onInk, marginTop: 2 },
  currency: { ...type.cardCurrency },
  stats: { flexDirection: 'row', gap: 24 },
  statLabel: { ...type.cardStatLabel, color: colors.onCard },
  statValue: { ...type.cardStatValue, ...tabularNums, color: colors.onInk },
  bar: { backgroundColor: colors.onCardSkeleton, borderRadius: 6 },
  barAmount: { height: 28, width: 170, marginTop: 6 },
  barStat: { height: 30, width: 96 },
});
