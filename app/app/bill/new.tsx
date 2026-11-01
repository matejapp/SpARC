import { router } from 'expo-router';
import { Platform } from 'react-native';

import { BillForm, emptyBillDraft } from '@/components/BillForm';
import { ModalHeader } from '@/components/ModalHeader';
import { useCreateBill } from '@/hooks/useBills';
import { offerReminders } from '@/lib/reminders';

// The add-bill modal (board → Add bill), opened from the bill list, the calendar and the
// dashboard. After the first save it offers reminders (F-06.3).
export default function NewBillScreen() {
  const create = useCreateBill();

  return (
    <BillForm
      initial={emptyBillDraft()}
      // On iOS a modal is a sheet below the status bar; on Android it covers the screen.
      topInset={Platform.OS !== 'ios'}
      header={<ModalHeader title="New bill" />}
      submitLabel="Save bill"
      pending={create.isPending}
      error={create.error}
      onSubmit={(request) =>
        create.mutate(request, {
          // The moment reminders make sense: there is now something to be reminded of. Asked
          // over this sheet, which closes once the user has answered.
          onSuccess: () => offerReminders().finally(() => router.back()),
        })
      }
    />
  );
}
