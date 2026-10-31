import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { CardRings } from '@/components/CardRings';
import { Wordmark } from '@/components/Wordmark';
import { formatSigned, formatSignedAmount } from '@/lib/money';
import { colors, gradients, radii, shadows, spacing, tabularNums, type } from '@/lib/theme';
import type { DashboardSummaryResponse } from '@/types/api';

// The current month on the orange card (board → Dashboard, first-run Dashboard). The accent
// gradient is reserved for this card, the add button and the icon (D-027). Amounts on it are
// one colour: on the accent, colour can't carry meaning, so the signs do.
//
// Shaped like a payment card (D-032): ISO/IEC 7810 ID-1 proportions, 85.60 × 53.98 mm, with a
// chip and the contactless mark, so it reads as a card rather than a panel at any phone width.
const CARD_RATIO = 85.6 / 53.98;
const MAX_WIDTH = 380;
const MIN_HEIGHT = 196; // below this the four rows no longer fit (very narrow phones)

function Chip() {
  return (
    <Svg width={38} height={28} viewBox="0 0 38 28" accessible={false}>
      <Rect x={0.5} y={0.5} width={37} height={27} rx={6} fill={colors.cardChip} />
      <Path
        d="M0.5 10H12M0.5 18H12M26 10h11.5M26 18h11.5M12 0.5v27M26 0.5v27M12 14h14"
        stroke={colors.cardChipLine}
        strokeWidth={1}
        fill="none"
      />
    </Svg>
  );
}

function Contactless() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M8 8.5a5 5 0 0 1 0 7M11.5 6a8.5 8.5 0 0 1 0 12M15 3.5a12 12 0 0 1 0 17"
        stroke={colors.onCard}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

export function MonthCard({
  code,
  summary,
}: {
  code: string; // "OCT 2026"
  summary: DashboardSummaryResponse | undefined; // undefined while loading
}) {
  const empty = summary !== undefined && summary.totalIncome === 0 && summary.totalExpense === 0;
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.min(screenWidth - spacing.gutter * 2, MAX_WIDTH);
  const height = Math.max(width / CARD_RATIO, MIN_HEIGHT);

  // The shadow lives on an outer view: the card clips its rings with overflow: hidden, and on
  // iOS that would clip its own shadow too, leaving it flat on the page.
  return (
    <View style={[styles.lift, { width, height }]}>
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
          <Wordmark size={15} color={colors.onAccent} />
          <Text style={styles.code}>{code}</Text>
        </View>

        <View style={styles.chipRow}>
          <Chip />
          <Contactless />
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
    </View>
  );
}

const styles = StyleSheet.create({
  lift: { alignSelf: 'center', borderRadius: radii.bankCard, boxShadow: shadows.monthCard },
  card: {
    flex: 1,
    borderRadius: radii.bankCard,
    overflow: 'hidden',
    paddingVertical: 22,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  code: { ...type.cardCode, color: colors.onAccent },
  caption: { ...type.cardCaption, color: colors.onCard },
  amount: { ...type.cardAmount, ...tabularNums, color: colors.onAccent, marginTop: 2 },
  currency: { ...type.cardCurrency },
  stats: { flexDirection: 'row', gap: 24 },
  statLabel: { ...type.cardStatLabel, color: colors.onCard },
  statValue: { ...type.cardStatValue, ...tabularNums, color: colors.onAccent },
  bar: { backgroundColor: colors.onCardSkeleton, borderRadius: 6 },
  barAmount: { height: 28, width: 170, marginTop: 6 },
  barStat: { height: 30, width: 96 },
});
