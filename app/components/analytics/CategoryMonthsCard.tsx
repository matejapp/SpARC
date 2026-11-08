import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { axisLabels, niceMax, useCardInnerWidth, Y_LABEL_WIDTH } from '@/components/analytics/chart';
import { formatAmount } from '@/lib/money';
import { monthLabel } from '@/lib/periods';
import { makeStyles, tabularNums, type, useTheme } from '@/lib/theme';
import type { AnalyticsCategoryMonthsResponse } from '@/types/api';

const HEIGHT = 150;
const GAP = 2; // the surface gap between stacked segments

/**
 * Spending per category over time (F-04.11): one stacked bar per month, the period's top five
 * categories plus Other, in their own colours (D-032). The month labels are buttons; the list
 * under the chart gives the chosen month's amounts, so every value is readable as text.
 */
export function CategoryMonthsCard({ data }: { data: AnalyticsCategoryMonthsResponse }) {
  const styles = useStyles();
  const theme = useTheme();
  const { colors } = theme;
  const inner = useCardInnerWidth();
  const { months, series } = data;
  const [picked, setPicked] = useState<number | null>(null);
  const selected = picked !== null && picked < months.length ? picked : months.length - 1;

  if (series.length === 0) {
    return <Text style={styles.empty}>No spending in these months.</Text>;
  }

  const colorOf = (i: number) =>
    series[i].isOther ? colors.ink2 : theme.categoryTone(series[i].name, 'expense').ink;
  const nameOf = (i: number) => (series[i].isOther ? 'Other' : (series[i].name ?? 'Uncategorised'));

  const width = inner - Y_LABEL_WIDTH;
  const slot = width / Math.max(months.length, 1);
  const barWidth = Math.min(26, slot * 0.6);
  // The tallest stack sets the axis. Heights only: the chart draws, the API sums (D-042).
  const tallest = Math.max(0, ...months.map((m) => m.amounts.reduce((a, b) => a + b, 0)));
  const top = niceMax(tallest);

  const stackData = months.map((m) => {
    const visible = m.amounts.map((value, i) => ({ value, i })).filter((s) => s.value > 0);
    return {
      stacks: visible.map((s, k) => ({
        value: s.value,
        color: colorOf(s.i),
        marginBottom: k > 0 ? GAP : 0,
        ...(k === visible.length - 1 ? { borderTopLeftRadius: 4, borderTopRightRadius: 4 } : {}),
      })),
      // An empty month still needs one stack for the chart to keep its slot.
      ...(visible.length === 0 ? { stacks: [{ value: 0, color: colors.tile }] } : {}),
    };
  });

  const sel = months[selected];

  return (
    <View style={styles.wrap}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <BarChart
          stackData={stackData}
          height={HEIGHT}
          width={width}
          barWidth={barWidth}
          spacing={slot - barWidth}
          initialSpacing={(slot - barWidth) / 2}
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
          xAxisLabelsHeight={0}
        />
      </View>
      <View style={[styles.months, { marginLeft: Y_LABEL_WIDTH }]}>
        {months.map((m, i) => (
          <Pressable
            key={m.month}
            onPress={() => setPicked(i)}
            accessibilityRole="button"
            accessibilityState={{ selected: i === selected }}
            accessibilityLabel={`Show ${monthLabel(m.month, 'long')} by category`}
            style={[styles.month, { width: slot }]}
          >
            <Text style={[styles.monthText, i === selected && styles.monthTextOn]} numberOfLines={1}>
              {slot < 28 ? monthLabel(m.month).charAt(0) : monthLabel(m.month)}
            </Text>
          </Pressable>
        ))}
      </View>
      {sel ? (
        <View accessibilityLiveRegion="polite">
          <Text style={styles.selTitle}>{monthLabel(sel.month, 'long')}</Text>
          {series.map((_, i) => (
            <View
              key={i}
              style={styles.legendRow}
              accessible
              accessibilityLabel={`${nameOf(i)}: ${formatAmount(sel.amounts[i] ?? 0)} ${data.currency}`}
            >
              <View style={[styles.swatch, { backgroundColor: colorOf(i) }]} />
              <Text style={styles.legendName} numberOfLines={1}>
                {nameOf(i)}
              </Text>
              <Text style={styles.legendValue}>{formatAmount(sel.amounts[i] ?? 0)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: 8 },
  empty: { ...type.body, color: t.colors.ink2 },
  axisText: { ...type.cardStatLabel, ...tabularNums, color: t.colors.ink2 },
  months: { flexDirection: 'row', marginTop: -4 },
  month: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  monthText: { ...type.cardStatLabel, color: t.colors.ink2 },
  monthTextOn: { fontFamily: type.tabLabelActive.fontFamily, color: t.colors.ink },
  selTitle: { ...type.label, color: t.colors.ink, paddingBottom: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 34, boxShadow: t.shadows.divider },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendName: { ...type.caption, color: t.colors.ink, flex: 1 },
  legendValue: { ...type.label, ...tabularNums, color: t.colors.ink },
}));
