import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TransactionForm, type TransactionDraft } from '@/components/TransactionForm';
import { Button } from '@/components/ui/Button';
import { RowsSkeleton } from '@/components/ui/Skeleton';
import { useDeleteTransaction, useTransaction, useUpdateTransaction } from '@/hooks/useTransactions';
import { formatAmount } from '@/lib/money';
import { colors, radii, shadows, spacing, type } from '@/lib/theme';
import type { TransactionResponse } from '@/types/api';

function toDraft(t: TransactionResponse): TransactionDraft {
  return {
    type: t.type,
    amountText: formatAmount(t.amount),
    categoryId: t.categoryId,
    occurredOn: t.occurredOn,
    description: t.description ?? '',
  };
}

// Detail, edit and delete in one screen, derived from Add transaction (the board draws none).
// The route segment [id] makes this a dynamic route: /transaction/<id> lands here with the id in
// useLocalSearchParams. The id is only a lookup key; the API answers 404 for anyone else's.
export default function TransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const transaction = useTransaction(id);
  const update = useUpdateTransaction(id);
  const remove = useDeleteTransaction(id);

  if (!transaction.data) {
    const gone = transaction.error instanceof ApiError && transaction.error.status === 404;
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
        <ScreenHeader title="Transaction" />
        {transaction.isPending ? (
          <RowsSkeleton rows={3} label="Loading the transaction" />
        ) : (
          <View style={styles.card}>
            <Text style={styles.messageTitle}>
              {gone ? 'This transaction no longer exists' : "This transaction didn't load"}
            </Text>
            <Text style={styles.messageText}>
              {gone ? 'It may have been deleted.' : transaction.error?.message}
            </Text>
            {gone ? (
              <Button label="Back" variant="secondary" onPress={() => router.back()} />
            ) : (
              <Button label="Try again" variant="secondary" onPress={() => transaction.refetch()} />
            )}
          </View>
        )}
      </View>
    );
  }

  const t = transaction.data;

  function confirmDelete() {
    const kind = t.type === 'income' ? 'income' : 'expense';
    Alert.alert(`Delete this ${kind}?`, "It's removed from your totals. This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          remove.mutate(undefined, {
            onSuccess: () => router.back(),
            onError: (e) => Alert.alert("Couldn't delete", e.message),
          }),
      },
    ]);
  }

  return (
    <TransactionForm
      key={t.id}
      initial={toDraft(t)}
      header={(kind) => <ScreenHeader title={kind === 'income' ? 'Edit income' : 'Edit expense'} />}
      submitLabel={() => 'Save changes'}
      pending={update.isPending}
      error={update.error}
      onSubmit={(request) => update.mutate(request, { onSuccess: () => router.back() })}
      after={
        <Button
          label="Delete transaction"
          variant="danger"
          loading={remove.isPending}
          loadingLabel="Deleting…"
          onPress={confirmDelete}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground, paddingHorizontal: spacing.gutter, gap: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    boxShadow: shadows.card,
    padding: 20,
    gap: 12,
  },
  messageTitle: { ...type.headline, color: colors.ink },
  messageText: { ...type.body, color: colors.ink2 },
});
