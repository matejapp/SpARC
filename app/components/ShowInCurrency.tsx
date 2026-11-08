import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useTransactionIn } from '@/hooks/useTransactions';
import { dateLabel } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { makeStyles, tabularNums, type } from '@/lib/theme';
import type { Currency, TransactionResponse } from '@/types/api';

const CURRENCIES = [
  { value: 'RSD', label: 'RSD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
] as const;

/**
 * A saved amount in RSD, EUR or USD at the NBS rate of the transaction's own date (D-051).
 * Display only: the currency pill above still sets the currency the transaction is saved in.
 * The API does the converting. A saved row already carries its own amount, its RSD value and
 * its preferred-currency value, so at most the third currency is fetched.
 */
export function ShowInCurrency({ transaction: t, unchanged }: { transaction: TransactionResponse; unchanged: boolean }) {
  const styles = useStyles();
  const [currency, setCurrency] = useState<Currency>(t.displayCurrency);
  const known = knownAmount(t, currency);
  const fetched = useTransactionIn(t.id, unchanged && known === undefined ? currency : null);
  const value = known !== undefined ? known : fetched.data?.displayAmount;

  let line: string;
  let failed = false;
  if (!unchanged) {
    line = 'Save your changes to see them in another currency.';
  } else if (currency === t.currency) {
    line = `${formatMoney(t.amount, currency)} as entered`;
  } else if (known === undefined && fetched.isError) {
    line = fetched.error.message;
    failed = true;
  } else if (known === undefined && fetched.isPending) {
    line = 'Converting…';
  } else if (value == null) {
    line = `There is no NBS rate for this date, so it can't be shown in ${currency}.`;
  } else {
    line = `= ${formatMoney(value, currency)} at the NBS rate for ${rateDay(t)}`;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Show in</Text>
      <SegmentedControl label="Show the amount in" options={CURRENCIES} value={currency} onChange={setCurrency} />
      <Text style={styles.line} accessibilityLiveRegion="polite">
        {line}
      </Text>
      {failed ? <Button label="Try again" variant="link" onPress={() => fetched.refetch()} /> : null}
    </View>
  );
}

/** What the saved row already says for `currency`; undefined when it has to be fetched. */
function knownAmount(t: TransactionResponse, currency: Currency): number | null | undefined {
  if (currency === t.currency) return t.amount;
  if (currency === 'RSD') return t.amountRsd;
  if (currency === t.displayCurrency) return t.displayAmount;
  return undefined;
}

// "Sat 8 Nov" (the year when it isn't this one), without the "Today, " the form's date row adds.
function rateDay(t: TransactionResponse): string {
  return dateLabel(t.occurredOn).replace(/^(Today|Yesterday), /, '');
}

const useStyles = makeStyles((t) => ({
  section: { marginTop: 28, gap: 10 },
  label: { ...type.label, color: t.colors.ink2 },
  line: { ...type.body, ...tabularNums, color: t.colors.ink },
}));
