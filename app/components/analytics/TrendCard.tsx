import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { axisLabels, niceMax, useCardInnerWidth, Y_LABEL_WIDTH } from '@/components/analytics/chart';
import { formatAmount, formatSigned } from '@/lib/money';
import { monthLabel } from '@/lib/periods';
import { makeStyles, radii, tabularNums, type, useTheme } from '@/lib/theme';
import type { AnalyticsTrendResponse } from '@/types/api';

const HEIGHT = 130;

/**
 * Income (green) and expense (ink) per month, the way rows colour them (F-04.4). The month
 * labels under the chart are buttons: tapping one shows that month's two numbers above it,
 * which also gives a screen reader every value.
 */
export function TrendCard({ trend }: { trend: AnalyticsTrendResponse }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const inner = useCardInnerWidth();
  const months = trend.months;
  const [picked, setPicked] = useState<number | null>(null);
  const selected = picked !== null && picked < months.length ? picked : months.length - 1;

  const width = inner - Y_LABEL_WIDTH;
  const step = width / Math.max(months.length, 1);
  const top = niceMax(Math.max(0, ...months.map((m) => Math.max(m.income, m.expense))));
  const point = (i: number, color: string) => ({
    hideDataPoint: i !== selected,
    dataPointColor: color,
    dataPointRadius: 4.5,
  });
  const income = months.map((m, i) => ({
    value: m.income,
    ...point(i, colors.income),
    showVerticalLine: i === selected,
    verticalLineColor: colors.placeholder,
    verticalLineThickness: 1,
    verticalLineStrokeDashArray: [3, 3],
  }));
  const expense = months.map((m, i) => ({ value: m.expense, ...point(i, colors.ink) }));
  const sel = months[selected];

  return (
    <View style={styles.wrap}>
      <View style={styles.legend} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <LegendLine color={colors.income} label="Income" />
        <LegendLine color={colors.ink} label="Expense" />
      </View>
      {sel ? (
        <View style={styles.readout} accessibilityLiveRegion="polite">
          <Text style={styles.readoutTitle}>{monthLabel(sel.month, 'long')}</Text>
          <Text style={styles.readoutValues}>
            <Text style={styles.incomeText}>{formatSigned(sel.income, 'income')}</Text>
            {'  ·  '}
            {formatSigned(sel.expense, 'expense')}
          </Text>
        </View>
      ) : null}
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <LineChart
          data={income}
          data2={expense}
          color1={colors.income}
          color2={colors.ink}
          thickness1={2}
          thickness2={2}
          height={HEIGHT}
          width={width}
          spacing={step}
          initialSpacing={step / 2}
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
      </View>
      <View style={[styles.months, { marginLeft: Y_LABEL_WIDTH }]}>
        {months.map((m, i) => (
          <Pressable
            key={m.month}
            onPress={() => setPicked(i)}
            accessibilityRole="button"
            accessibilityState={{ selected: i === selected }}
            accessibilityLabel={`${monthLabel(m.month, 'long')}: income ${formatAmount(m.income)}, expense ${formatAmount(m.expense)} ${trend.currency}`}
            style={[styles.month, { width: step }]}
          >
            <Text style={[styles.monthText, i === selected && styles.monthTextOn]} numberOfLines={1}>
              {/* A year's twelve months leave too little room for "Jan": "J". */}
              {step < 28 ? monthLabel(m.month).charAt(0) : monthLabel(m.month)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function LegendLine({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.legendItem}>
      {dashed ? (
        <View style={styles.dashes}>
          <View style={[styles.dash, { backgroundColor: color }]} />
          <View style={[styles.dash, { backgroundColor: color }]} />
        </View>
      ) : (
        <View style={[styles.swatch, { backgroundColor: color }]} />
      )}
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: 10 },
  legend: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 14, height: 2, borderRadius: 1 },
  dashes: { flexDirection: 'row', gap: 2, width: 14 },
  dash: { width: 6, height: 2, borderRadius: 1 },
  legendText: { ...type.fieldCaption, ...tabularNums, color: t.colors.ink2 },
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
  readoutValues: { ...type.label, ...tabularNums, color: t.colors.ink, flexShrink: 1, textAlign: 'right' },
  incomeText: { color: t.colors.income },
  axisText: { ...type.cardStatLabel, ...tabularNums, color: t.colors.ink2 },
  months: { flexDirection: 'row', marginTop: -6 },
  month: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  monthText: { ...type.cardStatLabel, color: t.colors.ink2 },
  monthTextOn: { fontFamily: type.tabLabelActive.fontFamily, color: t.colors.ink },
}));
