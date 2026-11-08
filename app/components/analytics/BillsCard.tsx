import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { formatMoney, formatPercent } from '@/lib/money';
import { makeStyles, radii, tabularNums, type, useTheme } from '@/lib/theme';
import type { AnalyticsBillsResponse } from '@/types/api';

const bills = (n: number) => `${n} ${n === 1 ? 'bill' : 'bills'}`;

/**
 * Bills in the period (F-04.13): what paying them took, what is still due, and how much of the
 * spending was recurring. Unpaid bills in another currency have no rate until they are paid
 * (D-039), so their total is an estimate at today's NBS rate, marked "≈".
 */
export function BillsCard({ data }: { data: AnalyticsBillsResponse }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { paid, unpaid, currency, recurringShare } = data;

  if (paid.count === 0 && unpaid.count === 0) {
    return (
      <View style={styles.none}>
        <Text style={styles.noneText}>No bills paid or due in this period.</Text>
        <Button label="Add a bill" variant="link" onPress={() => router.push('/bill/new')} />
      </View>
    );
  }

  const due = unpaid.byCurrency.map((c) => formatMoney(c.amount, c.currency));

  return (
    <View style={styles.wrap}>
      <View style={styles.tiles}>
        <View style={styles.tile} accessible accessibilityLabel={`Paid, ${bills(paid.count)}: ${formatMoney(paid.total, currency)}`}>
          <Text style={styles.tileLabel}>Paid · {bills(paid.count)}</Text>
          <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(paid.total, currency)}
          </Text>
        </View>
        <View
          style={styles.tile}
          accessible
          accessibilityLabel={`Still due, ${bills(unpaid.count)}: ${unpaid.isEstimate ? 'about ' : ''}${formatMoney(unpaid.estimatedTotal, currency)}`}
        >
          <Text style={styles.tileLabel}>Still due · {bills(unpaid.count)}</Text>
          <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
            {unpaid.isEstimate ? '≈ ' : ''}
            {formatMoney(unpaid.estimatedTotal, currency)}
          </Text>
        </View>
      </View>
      {unpaid.count > 0 ? (
        <Text style={styles.note}>
          Due: {joinAnd(due)}.
          {unpaid.isEstimate ? " Bills in another currency are estimated at today's NBS rate until they're paid." : ''}
        </Text>
      ) : null}
      <View style={styles.share}>
        <View style={styles.shareLine}>
          <Text style={styles.shareLabel}>Recurring share of spending</Text>
          <Text style={styles.shareValue}>{recurringShare === null ? '—' : formatPercent(recurringShare)}</Text>
        </View>
        {recurringShare === null ? (
          <Text style={styles.note}>No spending in this period.</Text>
        ) : (
          <View style={styles.track}>
            <View style={[styles.bar, { width: `${Math.min(recurringShare, 1) * 100}%`, backgroundColor: colors.ink }]} />
          </View>
        )}
      </View>
    </View>
  );
}

/** "a", "a and b", "a, b and c". */
function joinAnd(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: 12 },
  none: { alignItems: 'flex-start', gap: 4 },
  noneText: { ...type.body, color: t.colors.ink2 },
  tiles: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, padding: 14, borderRadius: 18, backgroundColor: t.colors.tile, gap: 4 },
  tileLabel: { ...type.cardStatLabel, color: t.colors.ink2 },
  tileValue: { ...type.rowAmount, ...tabularNums, fontSize: 16, color: t.colors.ink },
  note: { ...type.caption, ...tabularNums, color: t.colors.ink2 },
  share: { gap: 10, paddingTop: 14, boxShadow: t.shadows.divider },
  shareLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  shareLabel: { ...type.label, color: t.colors.ink, flexShrink: 1 },
  shareValue: { ...type.label, ...tabularNums, color: t.colors.ink },
  track: { height: 8, borderRadius: 4, backgroundColor: t.colors.tile, overflow: 'hidden' },
  bar: { height: 8, borderRadius: radii.pill },
}));
