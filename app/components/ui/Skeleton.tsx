import { StyleSheet, View } from 'react-native';

import { colors, radii, shadows } from '@/lib/theme';

const WIDTHS = [
  ['60%', '40%'],
  ['48%', '34%'],
  ['66%', '30%'],
  ['52%', '38%'],
] as const;

/** Grey stand-ins for transaction rows inside a card (board → Transactions, loading). */
export function RowsSkeleton({ rows = 4, label }: { rows?: number; label: string }) {
  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
    >
      {Array.from({ length: rows }, (_, i) => {
        const [a, b] = WIDTHS[i % WIDTHS.length];
        return (
          <View key={i} style={styles.row}>
            <View style={styles.tile} />
            <View style={styles.lines}>
              <View style={[styles.line, { width: a }]} />
              <View style={[styles.lineSoft, { width: b }]} />
            </View>
            <View style={styles.amount} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 22,
    boxShadow: shadows.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  tile: { width: 44, height: 44, borderRadius: radii.tile, backgroundColor: colors.hairline },
  lines: { flex: 1, gap: 8 },
  line: { height: 12, borderRadius: 6, backgroundColor: colors.hairline },
  lineSoft: { height: 10, borderRadius: 5, backgroundColor: colors.tile },
  amount: { width: 64, height: 12, borderRadius: 6, backgroundColor: colors.hairline },
});
