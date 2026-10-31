import { router, useLocalSearchParams } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { CloseIcon } from '@/components/icons';
import { emptyDraft, TransactionForm } from '@/components/TransactionForm';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { colors, radii, shadows, type } from '@/lib/theme';

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
      header={(t) => (
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={styles.close}
          >
            <CloseIcon color={colors.ink} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.heading}>
            {t === 'income' ? 'New income' : 'New expense'}
          </Text>
          <View style={styles.spacer} />
        </View>
      )}
      submitLabel={(t) => (t === 'income' ? 'Save income' : 'Save expense')}
      pending={create.isPending}
      error={create.error}
      onSubmit={(request) => create.mutate(request, { onSuccess: () => router.back() })}
    />
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadows.card,
  },
  heading: { ...type.modalTitle, color: colors.ink },
  spacer: { width: 48 },
});
