import { router, useLocalSearchParams } from 'expo-router';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { BillForm, type BillDraft } from '@/components/BillForm';
import { ModalHeader } from '@/components/ModalHeader';
import { Button } from '@/components/ui/Button';
import { RowsSkeleton } from '@/components/ui/Skeleton';
import { useBill, useUpdateBill } from '@/hooks/useBills';
import { formatAmount } from '@/lib/money';
import { makeStyles, radii, spacing, type } from '@/lib/theme';
import type { BillResponse } from '@/types/api';

function toDraft(b: BillResponse): BillDraft {
  return {
    name: b.name,
    amountText: formatAmount(b.amount),
    categoryId: b.categoryId, // null when its category was deleted: the form asks for a new one
    firstDueDate: b.firstDueDate,
    monthly: b.monthly,
  };
}

// The edit-bill modal (board → Edit bill), opened from the bill's detail card. The id is only a
// lookup key; the API answers 404 for a bill that isn't this user's or was deactivated.
export default function EditBillScreen() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const bill = useBill(id);
  const update = useUpdateBill(id);
  const topInset = Platform.OS !== 'ios';

  if (!bill.data) {
    const gone = bill.error instanceof ApiError && bill.error.status === 404;
    return (
      <View style={[styles.screen, { paddingTop: (topInset ? insets.top : 0) + 12 }]}>
        <ModalHeader title="Edit bill" />
        {bill.isPending ? (
          <RowsSkeleton rows={3} label="Loading the bill" />
        ) : (
          <View style={styles.card}>
            <Text style={styles.messageTitle}>
              {gone ? 'This bill no longer exists' : "This bill didn't load"}
            </Text>
            <Text style={styles.messageText}>
              {gone ? 'It may have been removed.' : bill.error?.message}
            </Text>
            {gone ? (
              <Button label="Close" variant="secondary" onPress={() => router.back()} />
            ) : (
              <Button label="Try again" variant="secondary" onPress={() => bill.refetch()} />
            )}
          </View>
        )}
      </View>
    );
  }

  return (
    <BillForm
      key={bill.data.id}
      initial={toDraft(bill.data)}
      topInset={topInset}
      header={<ModalHeader title="Edit bill" />}
      note="Changes apply to upcoming unpaid months. Months you've already paid stay as they were."
      submitLabel="Save changes"
      pending={update.isPending}
      error={update.error}
      onSubmit={(request) => update.mutate(request, { onSuccess: () => router.back() })}
    />
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.ground, paddingHorizontal: spacing.gutter, gap: 20 },
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: radii.card,
    boxShadow: t.shadows.card,
    padding: 20,
    gap: 12,
  },
  messageTitle: { ...type.headline, color: t.colors.ink },
  messageText: { ...type.body, color: t.colors.ink2 },
}));
