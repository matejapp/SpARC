import { router } from 'expo-router';
import { Platform } from 'react-native';

import { BillForm, emptyBillDraft } from '@/components/BillForm';
import { ModalHeader } from '@/components/ModalHeader';
import { useCreateBill } from '@/hooks/useBills';

// The add-bill modal (board → Add bill). Opened from the bills list and the calendar once
// those screens exist; until then it is reached by its route, /bill/new.
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
      onSubmit={(request) => create.mutate(request, { onSuccess: () => router.back() })}
    />
  );
}
