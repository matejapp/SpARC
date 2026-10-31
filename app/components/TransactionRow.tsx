import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/CategoryIcon';
import { formatSigned } from '@/lib/money';
import { colors, radii, shadows, tabularNums, type } from '@/lib/theme';
import type { TransactionResponse } from '@/types/api';

// One row as the board draws it: 44 × 44 tile with the category icon, the description (or the
// category when there is none), a caption, and the signed amount — ink for an expense, green
// for income, never orange.
export function TransactionRow({
  item,
  caption,
  divider,
  onPress,
}: {
  item: TransactionResponse;
  caption: string;
  divider: boolean;
  onPress: () => void;
}) {
  const income = item.type === 'income';
  const ink = income ? colors.income : colors.ink;
  const title = item.description || item.categoryName || (income ? 'Income' : 'Expense');
  const amount = formatSigned(item.amount, item.type, item.currency === 'RSD' ? undefined : item.currency);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${caption}, ${income ? 'income' : 'expense'} ${formatSigned(item.amount, item.type, item.currency)}`}
      accessibilityHint="Opens the transaction"
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.pressed]}
    >
      <View style={[styles.tile, { backgroundColor: income ? colors.incomeTint : colors.tile }]}>
        <CategoryIcon name={item.categoryName} color={ink} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.caption} numberOfLines={1}>
          {caption}
        </Text>
      </View>
      <Text style={[styles.amount, { color: ink }]}>{amount}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { height: 68, flexDirection: 'row', alignItems: 'center', gap: 14 },
  divider: { boxShadow: shadows.divider },
  pressed: { opacity: 0.6 },
  tile: {
    width: 44,
    height: 44,
    borderRadius: radii.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0 },
  title: { ...type.rowTitle, color: colors.ink },
  caption: { ...type.caption, color: colors.ink2 },
  amount: { ...type.rowAmount, ...tabularNums },
});
