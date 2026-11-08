import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

import { createBill, deactivateBill, getBill, listBills, updateBill } from '@/api/bills';
import { listOccurrences, listUpcoming, payOccurrence } from '@/api/occurrences';
import { billMonthsRange, type Month, monthSpan, todayIso } from '@/lib/dates';
import { cancelMonthReminders, rescheduleReminders } from '@/lib/reminders';
import type { BillRequest, BillResponse, IsoDate, PagedResponse } from '@/types/api';

// Every bill query lives under ['bills'] (the list, a detail, the dashboard's upcoming), and
// every month query under ['occurrences'] (the calendar's months, one bill's months). A create or
// edit changes a bill and its schedule, so it refreshes both prefixes.

const LIST_KEY = ['bills', 'list'] as const;
type ListData = InfiniteData<PagedResponse<BillResponse>>;

/** Active bills by name, a page at a time. */
export function useBillList() {
  return useInfiniteQuery({
    queryKey: LIST_KEY,
    queryFn: ({ pageParam }) => listBills(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.totalCount ? last.page + 1 : undefined,
  });
}

/** The pages as one list; a row that shifted between two page loads is kept once. */
export function flattenBills(data: ListData | undefined): BillResponse[] {
  const seen = new Set<string>();
  return (data?.pages ?? []).flatMap((page) =>
    page.items.filter((bill) => !seen.has(bill.id) && seen.add(bill.id)),
  );
}

export function useBill(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['bills', 'detail', id],
    queryFn: () => getBill(id),
    // Opened from the list: show the row already in hand while the fresh copy loads.
    placeholderData: () =>
      flattenBills(queryClient.getQueryData<ListData>(LIST_KEY)).find((bill) => bill.id === id),
  });
}

/** The calendar's month. */
export function useMonthOccurrences(month: Month) {
  const { from, to } = monthSpan(month);
  return useQuery({
    queryKey: ['occurrences', from, to],
    queryFn: () => listOccurrences(from, to),
  });
}

/** One bill's months: the last year and the schedule ahead. */
export function useBillOccurrences(billId: string) {
  return useQuery({
    queryKey: ['occurrences', 'bill', billId],
    queryFn: () => {
      const { from, to } = billMonthsRange();
      return listOccurrences(from, to, billId);
    },
  });
}

/**
 * The dashboard's bills, against the phone's today. Under ['bills'], so every bill change and
 * every payment refreshes it.
 */
export function useUpcomingBills() {
  return useQuery({
    queryKey: ['bills', 'upcoming'],
    queryFn: () => listUpcoming(todayIso()),
  });
}

// Every bill change also moves its reminders; rescheduling runs in the background. Analytics
// counts unpaid bills, so it refreshes too.
function useInvalidateBills() {
  const queryClient = useQueryClient();
  return () => {
    void rescheduleReminders();
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ['bills'] }),
      queryClient.invalidateQueries({ queryKey: ['occurrences'] }),
      queryClient.invalidateQueries({ queryKey: ['analytics'] }),
    ]);
  };
}

export function useCreateBill() {
  const invalidate = useInvalidateBills();
  return useMutation({
    mutationFn: (request: BillRequest) => createBill(request),
    onSuccess: invalidate,
  });
}

export function useUpdateBill(id: string) {
  const invalidate = useInvalidateBills();
  return useMutation({
    mutationFn: (request: BillRequest) => updateBill(id, request),
    onSuccess: invalidate,
  });
}

/**
 * Paying records an expense, so the transactions and the month totals change as well as the
 * bills. Refreshed on success and on failure: a 409 means the month was already paid elsewhere,
 * and the fresh list shows it.
 */
export function usePayOccurrence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paidOn = todayIso() }: { id: string; paidOn?: IsoDate }) => payOccurrence(id, paidOn),
    onSuccess: (_expense, { id }) => {
      void cancelMonthReminders(id).then(rescheduleReminders);
    },
    onSettled: () =>
      Promise.all(
        ['occurrences', 'bills', 'transactions', 'dashboard', 'analytics'].map((prefix) =>
          queryClient.invalidateQueries({ queryKey: [prefix] }),
        ),
      ),
  });
}

/**
 * Not the bill's own detail or months: that screen is still on screen while it closes, and
 * refetching a deactivated bill would flash "no longer exists". Their cache entries are
 * collected once the screen is gone.
 */
export function useDeactivateBill(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deactivateBill(id),
    onSuccess: () => {
      void rescheduleReminders();
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: LIST_KEY }),
        queryClient.invalidateQueries({ queryKey: ['bills', 'upcoming'] }),
        queryClient.invalidateQueries({ queryKey: ['analytics'] }),
        queryClient.invalidateQueries({
          queryKey: ['occurrences'],
          predicate: (query) => !(query.queryKey[1] === 'bill' && query.queryKey[2] === id),
        }),
      ]);
    },
  });
}
