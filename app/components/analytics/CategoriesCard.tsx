import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

import { CategoryIcon } from '@/components/CategoryIcon';
import { ChevronIcon } from '@/components/icons';
import { formatAmount, formatPercent } from '@/lib/money';
import type { Period } from '@/lib/periods';
import { toParams } from '@/lib/transactionFilters';
import { makeStyles, radii, tabularNums, type, useTheme } from '@/lib/theme';
import type { AnalyticsCategoriesResponse, AnalyticsCategoryShare } from '@/types/api';

const DONUT_SLICES = 5;

/**
 * Where the money went (F-04.10): a donut of the five largest categories plus Other, and every
 * category ranked with its share. A category keeps its own colour (D-032), whatever its rank.
 * Slices are sized by the API's shares, so the app adds no amounts. Tapping a row opens Activity
 * filtered to that category and period.
 */
export function CategoriesCard({ data, period }: { data: AnalyticsCategoriesResponse; period: Period }) {
  const styles = useStyles();
  const theme = useTheme();
  const { colors } = theme;
  const kind = data.type;
  const rows = data.categories;

  if (rows.length === 0) {
    return <Text style={styles.empty}>{kind === 'expense' ? 'No spending in this period.' : 'No income in this period.'}</Text>;
  }

  const colorOf = (c: AnalyticsCategoryShare) => theme.categoryTone(c.name, kind).ink;
  const top = rows.slice(0, DONUT_SLICES);
  const rest = rows.slice(DONUT_SLICES);
  const slices = top.map((c) => ({ value: c.share, color: colorOf(c) }));
  if (rest.length > 0) slices.push({ value: rest.reduce((sum, c) => sum + c.share, 0), color: colors.ink2 });
  const maxShare = rows[0].share || 1;

  const open = (c: AnalyticsCategoryShare) =>
    router.navigate({
      pathname: '/transactions',
      params: toParams({
        type: kind,
        from: period.from,
        to: period.to,
        ...(c.categoryId ? { categoryId: c.categoryId } : { uncategorised: true as const }),
      }),
    });

  return (
    <View style={styles.wrap}>
      <View
        style={styles.donut}
        accessible
        accessibilityLabel={`${kind === 'expense' ? 'Spending' : 'Income'} by category: ${rows
          .map((c) => `${nameOf(c)} ${formatPercent(c.share)}`)
          .join(', ')}`}
      >
        <PieChart
          data={slices}
          donut
          radius={90}
          innerRadius={70}
          innerCircleColor={colors.surface}
          strokeWidth={2}
          strokeColor={colors.surface}
          centerLabelComponent={() => (
            <View style={styles.center}>
              <Text style={styles.total} numberOfLines={1} adjustsFontSizeToFit>
                {formatAmount(data.total)}
              </Text>
              <Text style={styles.totalCaption}>
                {data.currency} {kind === 'expense' ? 'spent' : 'earned'}
              </Text>
            </View>
          )}
        />
      </View>
      {rest.length > 0 ? (
        <View style={styles.other} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={[styles.otherSwatch, { backgroundColor: colors.ink2 }]} />
          <Text style={styles.otherText} numberOfLines={2}>
            Other: {rest.map(nameOf).join(', ')}
          </Text>
        </View>
      ) : null}

      <View>
        {rows.map((c, i) => {
          const tone = theme.categoryTone(c.name, kind);
          return (
            <Pressable
              key={c.categoryId ?? 'uncategorised'}
              onPress={() => open(c)}
              accessibilityRole="button"
              accessibilityLabel={`${nameOf(c)}, ${formatAmount(c.total)} ${data.currency}, ${formatPercent(c.share)}`}
              accessibilityHint="Opens its transactions"
              style={({ pressed }) => [styles.row, i > 0 && styles.divider, pressed && styles.pressed]}
            >
              <View style={[styles.tile, { backgroundColor: tone.tint }]}>
                <CategoryIcon name={c.name} color={tone.ink} size={18} />
              </View>
              <View style={styles.rowBody}>
                <View style={styles.rowLine}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {nameOf(c)}
                  </Text>
                  <Text style={styles.rowAmount}>{formatAmount(c.total)}</Text>
                </View>
                <View style={styles.rowLine}>
                  <View style={styles.track}>
                    <View style={[styles.bar, { width: `${(c.share / maxShare) * 100}%`, backgroundColor: tone.ink }]} />
                  </View>
                  <Text style={styles.share}>{formatPercent(c.share)}</Text>
                </View>
              </View>
              <ChevronIcon color={colors.placeholder} size={16} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const nameOf = (c: AnalyticsCategoryShare) => c.name ?? 'Uncategorised';

const useStyles = makeStyles((t) => ({
  wrap: { gap: 10 },
  empty: { ...type.body, color: t.colors.ink2 },
  donut: { alignItems: 'center', paddingVertical: 6 },
  center: { alignItems: 'center', width: 124 },
  total: { ...type.modalTitle, ...tabularNums, fontFamily: type.display.fontFamily, color: t.colors.ink },
  totalCaption: { ...type.cardStatLabel, color: t.colors.ink2 },
  other: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8 },
  otherSwatch: { width: 8, height: 8, borderRadius: 2 },
  otherText: { ...type.cardStatLabel, color: t.colors.ink2, flexShrink: 1, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 6 },
  divider: { boxShadow: t.shadows.divider },
  pressed: { backgroundColor: t.colors.overlay },
  tile: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, minWidth: 0, gap: 6 },
  rowLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowName: { ...type.label, fontSize: 14, color: t.colors.ink, flexShrink: 1 },
  rowAmount: { ...type.rowAmount, ...tabularNums, fontSize: 14, color: t.colors.ink },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: t.colors.tile, overflow: 'hidden' },
  bar: { height: 6, borderRadius: 3 },
  share: { ...type.cardStatLabel, ...tabularNums, color: t.colors.ink2, width: 48, textAlign: 'right' },
}));
