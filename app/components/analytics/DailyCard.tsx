import { useState } from 'react';
import { Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { useCardInnerWidth } from '@/components/analytics/chart';
import { dateLabel, rangeLabel, todayIso } from '@/lib/dates';
import { formatAmount, formatSigned } from '@/lib/money';
import { makeStyles, radii, tabularNums, type, useTheme } from '@/lib/theme';
import type { AnalyticsDailyResponse } from '@/types/api';

const HEIGHT = 120;

/**
 * Spending per day of the month (F-04.12), with the period's average per day as a dashed line.
 * Tapping a bar shows that day above the chart; it opens on today in the running month, else on
 * the month's biggest day.
 */
export function DailyCard({ data, averagePerDay }: { data: AnalyticsDailyResponse; averagePerDay: number | null }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const inner = useCardInnerWidth();
  const days = data.days;
  const today = todayIso();

  const biggest = days.reduce((best, d, i) => (d.expense > days[best].expense ? i : best), 0);
  const todayIndex = days.findIndex((d) => d.date === today);
  const [picked, setPicked] = useState<number | null>(null);
  const selected = picked ?? (todayIndex >= 0 ? todayIndex : biggest);
  const sel = days[selected];

  const slot = inner / Math.max(days.length, 1);
  const barWidth = Math.max(3, Math.min(8, slot * 0.6));
  const top = Math.max(1, ...days.map((d) => d.expense)) * 1.08; // headroom over the tallest bar
  const avgShown = averagePerDay !== null && averagePerDay > 0;

  return (
    <View style={styles.wrap}>
      {sel ? (
        <View style={styles.readout} accessibilityLiveRegion="polite">
          <Text style={styles.readoutTitle}>{dateLabel(sel.date, today)}</Text>
          <Text style={styles.readoutValue}>
            {sel.expense > 0 ? formatSigned(sel.expense, 'expense', data.currency) : 'Nothing spent'}
          </Text>
        </View>
      ) : null}
      <View
        accessible
        accessibilityLabel={
          `Daily spending. Biggest day ${dateLabel(days[biggest]?.date ?? today, today)}, ${formatAmount(days[biggest]?.expense ?? 0)} ${data.currency}.` +
          (avgShown ? ` Average per day ${formatAmount(averagePerDay)}.` : '')
        }
      >
        <BarChart
          data={days.map((d, i) => ({
            value: d.expense,
            frontColor: i === selected ? colors.ink : d.expense > 0 ? colors.placeholder : colors.muted,
            onPress: () => setPicked(i),
          }))}
          height={HEIGHT}
          width={inner}
          barWidth={barWidth}
          spacing={slot - barWidth}
          initialSpacing={(slot - barWidth) / 2}
          endSpacing={0}
          barBorderTopLeftRadius={3}
          barBorderTopRightRadius={3}
          disableScroll
          maxValue={top}
          noOfSections={1}
          hideYAxisText
          yAxisLabelWidth={0}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={colors.hairline}
          hideRules
          xAxisLabelsHeight={0}
          showReferenceLine1={avgShown}
          referenceLine1Position={averagePerDay ?? 0}
          referenceLine1Config={{
            color: colors.placeholder,
            thickness: 1,
            dashWidth: 4,
            dashGap: 3,
            labelText: avgShown ? `avg ${formatAmount(averagePerDay)}` : '',
            labelTextStyle: styles.avgText,
          }}
        />
      </View>
      <View style={styles.axis}>
        <Text style={styles.axisText}>{dayMonth(days[0]?.date)}</Text>
        <Text style={styles.axisText}>15</Text>
        <Text style={styles.axisText}>{dayMonth(days[days.length - 1]?.date)}</Text>
      </View>
    </View>
  );
}

// "1 Oct" from "2026-10-01" ("1 Oct 2025" in another year).
function dayMonth(iso: string | undefined): string {
  return iso ? rangeLabel(iso, iso) : '';
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: 10 },
  readout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.tile,
    backgroundColor: t.colors.tile,
  },
  readoutTitle: { ...type.label, color: t.colors.ink },
  readoutValue: { ...type.label, ...tabularNums, color: t.colors.ink },
  avgText: { ...type.cardStatLabel, ...tabularNums, color: t.colors.ink2, textAlign: 'right' },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  axisText: { ...type.cardStatLabel, color: t.colors.ink2 },
}));
