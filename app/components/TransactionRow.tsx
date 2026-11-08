import { Pressable, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/CategoryIcon';
import { formatSigned } from '@/lib/money';
import { makeStyles, radii, tabularNums, type, useTheme } from '@/lib/theme';
import type { TransactionResponse } from '@/types/api';

// One row as the board draws it: 44 × 44 tile with the category icon in its colour (D-032), the description (or the
// category when there is none), a caption, and the signed amount — ink for an expense, green
// for income, never orange. The amount is in the preferred currency (D-051); a row entered in
// another one shows that original amount small beneath it. No rate for its date: as entered.
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
  const styles = useStyles();
  const { categoryTone, colors } = useTheme();
  const income = item.type === 'income';
  const ink = income ? colors.income : colors.ink; // the amount
  const tone = categoryTone(item.categoryName, item.type);
  const title = item.description || item.categoryName || (income ? 'Income' : 'Expense');
  const shownCurrency = item.displayAmount === null ? item.currency : item.displayCurrency;
  const shown = item.displayAmount ?? item.amount;
  const amount = formatSigned(shown, item.type, shownCurrency === 'RSD' ? undefined : shownCurrency);
  const original = shownCurrency === item.currency ? null : formatSigned(item.amount, item.type, item.currency);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${caption}, ${income ? 'income' : 'expense'} ${formatSigned(shown, item.type, shownCurrency)}${original ? `, entered as ${original}` : ''}`}
      accessibilityHint="Opens the transaction"
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.pressed]}
    >
      <View style={[styles.tile, { backgroundColor: tone.tint }]}>
        <CategoryIcon name={item.categoryName} color={tone.ink} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.caption} numberOfLines={1}>
          {caption}
        </Text>
      </View>
      <View style={styles.amounts}>
        <Text style={[styles.amount, { color: ink }]}>{amount}</Text>
        {original ? <Text style={styles.original}>{original}</Text> : null}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  row: { height: 68, flexDirection: 'row', alignItems: 'center', gap: 14 },
  divider: { boxShadow: t.shadows.divider },
  pressed: { opacity: 0.6 },
  tile: {
    width: 44,
    height: 44,
    borderRadius: radii.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0 },
  title: { ...type.rowTitle, color: t.colors.ink },
  caption: { ...type.caption, color: t.colors.ink2 },
  amounts: { alignItems: 'flex-end' },
  amount: { ...type.rowAmount, ...tabularNums },
  original: { ...type.caption, ...tabularNums, color: t.colors.ink2 },
}));
