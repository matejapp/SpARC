import { Text, View } from 'react-native';

import { CARD_PADDING } from '@/components/analytics/chart';
import type { Period } from '@/lib/periods';
import { formatAmount, formatPercent, formatSigned, formatSignedAmount } from '@/lib/money';
import { makeStyles, radii, tabularNums, type } from '@/lib/theme';
import type { AnalyticsSummaryResponse } from '@/types/api';

/**
 * What's left, then income, expense, savings rate and average per day, each against the period
 * before (F-04.8). Every number and every change is the API's (D-042); the app only words them.
 */
export function HeadlineCard({ summary, period }: { summary: AnalyticsSummaryResponse; period: Period }) {
  const styles = useStyles();
  const { current, change, currency } = summary;
  const prev = period.previousName;

  return (
    <View style={styles.card} accessibilityLabel="Headline numbers">
      <View>
        <Text style={styles.caption}>What's left</Text>
        <Text style={styles.net}>
          {formatSignedAmount(current.net)} <Text style={styles.netCurrency}>{currency}</Text>
        </Text>
        <Text style={styles.change}>{compare(change.net, prev)}</Text>
      </View>
      <View style={styles.grid}>
        <Stat label="Income" value={formatSigned(current.income, 'income')} income change={compare(change.income, prev)} />
        <Stat label="Expense" value={formatSigned(current.expense, 'expense')} change={compare(change.expense, prev)} />
        <Stat
          label="Savings rate"
          value={current.savingsRate === null ? '—' : formatPercent(current.savingsRate)}
          change={
            current.savingsRate === null
              ? 'No income in this period'
              : change.savingsRate === null
                ? `No income in ${prev}`
                : `${formatPercent(change.savingsRate, true)} vs ${prev}`
          }
        />
        <Stat
          label="Average per day"
          value={formatAmount(current.averageDailySpend)}
          change={compare(change.averageDailySpend, prev)}
        />
      </View>
    </View>
  );
}

/** "2.000,00 more than September", "15.349,50 less than September", "Same as September". */
function compare(change: number, prev: string): string {
  if (change === 0) return `Same as ${prev}`;
  return `${formatAmount(change)} ${change > 0 ? 'more' : 'less'} than ${prev}`;
}

function Stat({ label, value, change, income = false }: { label: string; value: string; change: string; income?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}. ${change}`}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, income && styles.income]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statChange}>{change}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: radii.card,
    paddingVertical: 22,
    paddingHorizontal: CARD_PADDING,
    gap: 18,
    boxShadow: t.shadows.card,
  },
  caption: { ...type.cardCaption, color: t.colors.ink2 },
  net: { ...type.display, ...tabularNums, color: t.colors.ink, marginTop: 2 },
  netCurrency: { ...type.cardCurrency, color: t.colors.ink2 },
  change: { ...type.caption, color: t.colors.ink2, marginTop: 4 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 16,
    paddingTop: 16,
    boxShadow: t.shadows.divider,
  },
  stat: { width: '50%', paddingRight: 12, gap: 2 },
  statLabel: { ...type.cardStatLabel, color: t.colors.ink2 },
  statValue: { ...type.rowAmount, ...tabularNums, fontSize: 17, color: t.colors.ink },
  income: { color: t.colors.income },
  statChange: { ...type.cardStatLabel, color: t.colors.ink2 },
}));
