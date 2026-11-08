import { Text, View } from 'react-native';

import { formatMoney, formatPercent } from '@/lib/money';
import { makeStyles, radii, tabularNums, type, useTheme } from '@/lib/theme';
import type { AnalyticsCurrenciesResponse } from '@/types/api';

/**
 * Spending by the currency each entry was made in (F-04.14): the exact sum as entered, and for
 * a foreign currency what it came to in the display currency, each row at its own date's rate
 * (D-041). Shares are of the converted totals.
 */
export function CurrenciesCard({ data }: { data: AnalyticsCurrenciesResponse }) {
  const styles = useStyles();
  const { colors } = useTheme();

  if (data.currencies.length === 0) {
    return <Text style={styles.empty}>No spending in this period.</Text>;
  }

  return (
    <View>
      {data.currencies.map((c, i) => {
        const entries = `${c.count} ${c.count === 1 ? 'entry' : 'entries'}`;
        const converted = c.entryCurrency !== data.currency;
        const detail = converted ? `${entries} · ${formatMoney(c.total, data.currency)} at each date's rate` : entries;
        return (
          <View
            key={c.entryCurrency}
            style={[styles.row, i > 0 && styles.divider]}
            accessible
            accessibilityLabel={`${c.entryCurrency}: ${formatMoney(c.amount, c.entryCurrency)}, ${formatPercent(c.share)}. ${detail}`}
          >
            <View style={styles.code}>
              <Text style={styles.codeText}>{c.entryCurrency}</Text>
            </View>
            <View style={styles.body}>
              <View style={styles.line}>
                <Text style={styles.entered} numberOfLines={1}>
                  {formatMoney(c.amount, c.entryCurrency)}
                </Text>
                <Text style={styles.share}>{formatPercent(c.share)}</Text>
              </View>
              <Text style={styles.detail}>{detail}</Text>
              <View style={styles.track}>
                <View style={[styles.bar, { width: `${c.share * 100}%`, backgroundColor: colors.ink }]} />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  empty: { ...type.body, color: t.colors.ink2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 8 },
  divider: { boxShadow: t.shadows.divider },
  code: { width: 48, height: 32, borderRadius: 10, backgroundColor: t.colors.tile, alignItems: 'center', justifyContent: 'center' },
  codeText: { ...type.cardCode, color: t.colors.ink },
  body: { flex: 1, minWidth: 0, gap: 4 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  entered: { ...type.label, ...tabularNums, fontSize: 14, color: t.colors.ink, flexShrink: 1 },
  share: { ...type.rowAmount, ...tabularNums, fontSize: 14, color: t.colors.ink },
  detail: { ...type.cardStatLabel, ...tabularNums, color: t.colors.ink2 },
  track: { height: 4, borderRadius: 2, backgroundColor: t.colors.tile, overflow: 'hidden', marginTop: 2 },
  bar: { height: 4, borderRadius: radii.pill },
}));
