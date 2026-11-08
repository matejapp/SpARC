import { router, useLocalSearchParams } from 'expo-router';
import { Platform, Text, View } from 'react-native';

import { isReceiptNumber } from '@/api/receipts';
import { ModalHeader } from '@/components/ModalHeader';
import { emptyDraft, TransactionForm, type TransactionDraft } from '@/components/TransactionForm';
import { ErrorBanner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { isIsoDate } from '@/lib/dates';
import { parseAmount } from '@/lib/money';
import { makeStyles, type } from '@/lib/theme';

type Params = {
  type?: string;
  // From the scan screen (D-045, D-048). Route params can also come from a link, so each is
  // checked.
  receipt?: string;
  source?: string; // 'qr' or 'photo'
  amount?: string;
  occurredOn?: string;
  store?: string;
  location?: string;
  receiptNumber?: string;
  existingId?: string;
};

type Receipt = {
  draft: TransactionDraft;
  fromPhoto: boolean;
  missingAmount: boolean;
  missingDate: boolean;
  store: string | null;
  number: string | null;
  existingId: string | null;
};

const MAX_STORE_LENGTH = 100;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The add modal (board → Add transaction), opened by the tab bar's + and by the dashboard's
// Expense / Income buttons, which pass ?type= to start on the right side of the switch.
// An expense can start from a receipt instead: the scan screen replaces this one, and comes back
// with a draft to review. Nothing is saved until the user saves (domain rule 6); closing discards.
export default function AddTransactionScreen() {
  const styles = useStyles();
  const params = useLocalSearchParams<Params>();
  const create = useCreateTransaction();
  const receipt = readReceipt(params);

  return (
    <TransactionForm
      initial={receipt?.draft ?? emptyDraft(params.type === 'income' ? 'income' : 'expense')}
      // On iOS a modal is a sheet below the status bar; on Android it covers the screen.
      topInset={Platform.OS !== 'ios'}
      header={(t) => (
        <>
          <ModalHeader title={t === 'income' ? 'New income' : 'New expense'} />
          {receipt ? (
            <View style={styles.receipt}>
              <Text style={styles.note}>
                {(receipt.fromPhoto ? 'From a photo' : 'From a receipt') +
                  (receipt.store ? ` · ${receipt.store}` : '')}
              </Text>
              <Text style={styles.noteQuiet}>{receiptHint(receipt)}</Text>
              {receipt.existingId ? (
                <View style={styles.existing}>
                  <ErrorBanner message="This receipt is already in your activity." />
                  <Button
                    label="Open it"
                    variant="link"
                    onPress={() =>
                      router.replace({ pathname: '/transaction/[id]', params: { id: receipt.existingId! } })
                    }
                  />
                </View>
              ) : null}
            </View>
          ) : t === 'expense' ? (
            // A receipt is always a purchase, so the scan is offered for expenses only.
            <View style={styles.scan}>
              <Button label="Scan a receipt" variant="secondary" onPress={() => router.replace('/scan')} />
            </View>
          ) : null}
        </>
      )}
      submitLabel={(t) => (t === 'income' ? 'Save income' : 'Save expense')}
      pending={create.isPending}
      error={create.error}
      onSubmit={(request) =>
        create.mutate(
          // The receipt number goes with the expense so the same receipt can't be entered twice
          // (D-047). Switched to income, it is no longer that purchase, and goes without it.
          receipt?.number && request.type === 'expense'
            ? { ...request, fiscalReceiptNumber: receipt.number }
            : request,
          { onSuccess: () => router.back() },
        )
      }
    />
  );
}

/**
 * The scan's draft, or null when this isn't one. Each part is checked and dropped on its own if
 * it doesn't read. A QR draft always has amount and date; a photo may lack either, and the form
 * leaves the amount empty and the date on today for the user to fix — never a guess.
 */
function readReceipt(p: Params): Receipt | null {
  if (p.receipt !== '1') return null;
  const amount = typeof p.amount === 'string' && parseAmount(p.amount).ok ? p.amount : null;
  const occurredOn = isIsoDate(p.occurredOn) ? p.occurredOn : null;
  if (amount === null && occurredOn === null) return null;

  // The company names the receipt; the shop or till it came from goes in the description.
  // Each stands in for the other when the record gave only one.
  const store = shortText(p.store);
  const location = shortText(p.location);
  return {
    draft: {
      ...emptyDraft('expense'),
      amountText: amount ?? '',
      ...(occurredOn ? { occurredOn } : {}),
      description: location ?? store ?? '',
    },
    fromPhoto: p.source === 'photo',
    missingAmount: amount === null,
    missingDate: occurredOn === null,
    store: store ?? location,
    number: isReceiptNumber(p.receiptNumber) ? p.receiptNumber : null,
    existingId: typeof p.existingId === 'string' && UUID.test(p.existingId) ? p.existingId : null,
  };
}

/** What to check, most important first: what the scan couldn't read, then the rest. */
function receiptHint(r: Receipt): string {
  if (r.missingAmount && r.missingDate) return "The total and date couldn't be read. Enter the total and check the date.";
  if (r.missingAmount) return "The total couldn't be read. Enter it, then pick a category.";
  if (r.missingDate) return "The date couldn't be read, so it's set to today. Check it, then pick a category.";
  if (r.fromPhoto) return 'Read from a photo, so check the amount and date, then pick a category.';
  if (!r.store) return "The store's name wasn't available. Pick a category, and add a description if you like.";
  return 'Check the amount and date, then pick a category.';
}

function shortText(value: unknown): string | null {
  return typeof value === 'string' ? value.trim().slice(0, MAX_STORE_LENGTH) || null : null;
}

const useStyles = makeStyles((t) => ({
  scan: { marginTop: 20 },
  receipt: { marginTop: 20, gap: 4 },
  note: { ...type.headline, color: t.colors.ink, textAlign: 'center' },
  noteQuiet: { ...type.caption, color: t.colors.ink2, textAlign: 'center' },
  existing: { marginTop: 12, alignItems: 'center', gap: 2 },
}));
