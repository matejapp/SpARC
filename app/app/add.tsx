import { router, useLocalSearchParams } from 'expo-router';
import { Platform } from 'react-native';

import { ModalHeader } from '@/components/ModalHeader';
import { emptyDraft, TransactionForm } from '@/components/TransactionForm';
import { useCreateTransaction } from '@/hooks/useTransactions';

// The add modal (board → Add transaction), opened by the tab bar's + and by the dashboard's
// Expense / Income buttons, which pass ?type= to start on the right side of the switch.
export default function AddTransactionScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const create = useCreateTransaction();

  return (
    <TransactionForm
      initial={emptyDraft(params.type === 'income' ? 'income' : 'expense')}
      // On iOS a modal is a sheet below the status bar; on Android it covers the screen.
      topInset={Platform.OS !== 'ios'}
      header={(t) => <ModalHeader title={t === 'income' ? 'New income' : 'New expense'} />}
      submitLabel={(t) => (t === 'income' ? 'Save income' : 'Save expense')}
      pending={create.isPending}
      error={create.error}
      onSubmit={(request) => create.mutate(request, { onSuccess: () => router.back() })}
    />
  );
}
