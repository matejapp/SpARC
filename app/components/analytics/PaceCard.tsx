import { Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { axisLabels, niceMax, useCardInnerWidth, Y_LABEL_WIDTH } from '@/components/analytics/chart';
import { LegendLine } from '@/components/analytics/TrendCard';
import { formatMoney } from '@/lib/money';
import { monthLabel } from '@/lib/periods';
import { makeStyles, tabularNums, type, useTheme } from '@/lib/theme';
import type { AnalyticsPaceResponse } from '@/types/api';

const HEIGHT = 130;
const TICKS = [1, 8, 15, 22];

/**
 * Spending pace (F-04.9): the running expense of the month (solid) against the month before
 * (dashed), by day of month. The month's line stops at today. The app compares the two by
 * showing both running totals, never by subtracting them (D-031).
 */
export function PaceCard({ pace }: { pace: AnalyticsPaceResponse }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const inner = useCardInnerWidth();

  const days = pace.days;
  const current = days.filter((d) => d.current !== null);
  const previous = days.filter((d) => d.previous !== null);
  const lastCurrent = current[current.length - 1];
  const lastPrevious = previous[previous.length - 1];
  const sameDayPrevious = lastCurrent
    ? (days.find((d) => d.day === lastCurrent.day)?.previous ?? lastPrevious?.previous ?? null)
    : null;

  const width = inner - Y_LABEL_WIDTH;
  const step = (width - 8) / Math.max(days.length - 1, 1);
  const top = niceMax(Math.max(0, ...days.map((d) => Math.max(d.current ?? 0, d.previous ?? 0))));
  const monthName = monthLabel(pace.month, 'long').split(' ')[0];
  const previousName = monthLabel(pace.previousMonth, 'long').split(' ')[0];
  const running = lastCurrent && lastCurrent.day < daysInMonth(pace.month);

  let sentence: string;
  if (!lastCurrent) {
    sentence = `Nothing spent in ${monthName} yet.`;
  } else if (running) {
    sentence =
      `By ${lastCurrent.day} ${monthName.slice(0, 3)}: ${formatMoney(lastCurrent.current ?? 0, pace.currency)}. ` +
      `By the same day of ${previousName}: ${formatMoney(sameDayPrevious ?? 0, pace.currency)}.`;
  } else {
    sentence =
      `${monthName}: ${formatMoney(lastCurrent.current ?? 0, pace.currency)}. ` +
      `${previousName}: ${formatMoney(lastPrevious?.previous ?? 0, pace.currency)}.`;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.sentence}>{sentence}</Text>
      <View style={styles.legend} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <LegendLine color={colors.ink} label={monthName} />
        <LegendLine color={colors.ink2} label={previousName} dashed />
      </View>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <LineChart
          data={current.map((d, i) => ({
            value: d.current ?? 0,
            hideDataPoint: i !== current.length - 1,
            dataPointColor: colors.ink,
            dataPointRadius: 4.5,
          }))}
          data2={previous.map((d) => ({ value: d.previous ?? 0, hideDataPoint: true }))}
          color1={colors.ink}
          color2={colors.ink2}
          thickness1={2}
          thickness2={2}
          strokeDashArray2={[4, 3]}
          height={HEIGHT}
          width={width}
          spacing={step}
          initialSpacing={4}
          endSpacing={0}
          disableScroll
          maxValue={top}
          noOfSections={2}
          yAxisLabelTexts={axisLabels(top)}
          yAxisLabelWidth={Y_LABEL_WIDTH}
          yAxisTextStyle={styles.axisText}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={colors.hairline}
          rulesColor={colors.hairline}
          rulesType="solid"
        />
        <View style={[styles.ticks, { marginLeft: Y_LABEL_WIDTH }]}>
          {[...TICKS, days.length].map((day) => (
            <Text key={day} style={[styles.tick, { left: 4 + (day - 1) * step - 12 }]}>
              {day}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function daysInMonth(key: string): number {
  return new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)), 0).getDate();
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: 10 },
  sentence: { ...type.caption, ...tabularNums, color: t.colors.ink2 },
  legend: { flexDirection: 'row', gap: 16 },
  axisText: { ...type.cardStatLabel, ...tabularNums, color: t.colors.ink2 },
  ticks: { height: 16, marginTop: -8 },
  tick: { ...type.cardStatLabel, color: t.colors.ink2, position: 'absolute', width: 24, textAlign: 'center' },
}));
