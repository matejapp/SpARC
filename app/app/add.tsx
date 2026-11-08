import { router, useLocalSearchParams } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { ModalHeader } from '@/components/ModalHeader';
import { emptyDraft, TransactionForm } from '@/components/TransactionForm';
import { Button } from '@/components/ui/Button';
import { useCreateTransaction } from '@/hooks/useTransactions';

// The add modal (board → Add transaction), opened by the tab bar's + and by the dashboard's
// Expense / Income buttons, which pass ?type= to start on the right side of the switch.
// An expense can start from a receipt instead: the scan screen replaces this one (D-045).
export default function AddTransactionScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const create = useCreateTransaction();

  return (
    <TransactionForm
      initial={emptyDraft(params.type === 'income' ? 'income' : 'expense')}
      // On iOS a modal is a sheet below the status bar; on Android it covers the screen.
      topInset={Platform.OS !== 'ios'}
      header={(t) => (
        <>
          <ModalHeader title={t === 'income' ? 'New income' : 'New expense'} />
          {/* A receipt is always a purchase, so the scan is offered for expenses only. */}
          {t === 'expense' ? (
            <View style={styles.scan}>
              <Button label="Scan a receipt" variant="secondary" onPress={() => router.replace('/scan')} />
            </View>
          ) : null}
        </>
      )}
      submitLabel={(t) => (t === 'income' ? 'Save income' : 'Save expense')}
      pending={create.isPending}
      error={create.error}
      onSubmit={(request) => create.mutate(request, { onSuccess: () => router.back() })}
    />
  );
}

const styles = StyleSheet.create({ scan: { marginTop: 20 } });
