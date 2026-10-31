import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

import { listCategories } from '@/api/categories';
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  listTransactions,
  updateTransaction,
} from '@/api/transactions';
import type { PagedResponse, TransactionRequest, TransactionResponse, TransactionType } from '@/types/api';

// Every transaction query lives under the ['transactions'] prefix, so one invalidation after a
// write refreshes the list, any open detail and — with ['dashboard'] — the month totals.

const LIST_KEY = ['transactions', 'list'] as const;
type ListData = InfiniteData<PagedResponse<TransactionResponse>>;

/** Newest first, a page at a time. Pages are offset-based (D-024): see flattenPages. */
export function useTransactionList() {
  return useInfiniteQuery({
    queryKey: LIST_KEY,
    queryFn: ({ pageParam }) => listTransactions(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.totalCount ? last.page + 1 : undefined,
  });
}

/**
 * The pages as one list. With offset paging a transaction added between two page loads shifts
 * the next page by one, so the same row can arrive twice; the first copy wins.
 */
export function flattenPages(data: ListData | undefined): TransactionResponse[] {
  const seen = new Set<string>();
  const rows: TransactionResponse[] = [];
  for (const page of data?.pages ?? []) {
    for (const row of page.items) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        rows.push(row);
      }
    }
  }
  return rows;
}

export function useTransaction(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['transactions', 'detail', id],
    queryFn: () => getTransaction(id),
    // Opened from the list: show the row already in hand while the fresh copy loads.
    placeholderData: () =>
      flattenPages(queryClient.getQueryData<ListData>(LIST_KEY)).find((row) => row.id === id),
  });
}

export function useCategories(kind: TransactionType) {
  return useQuery({
    queryKey: ['categories', kind],
    queryFn: () => listCategories(kind),
    staleTime: 10 * 60_000, // the system set never changes at runtime
  });
}

function useInvalidateMoney() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
}

export function useCreateTransaction() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: (request: TransactionRequest) => createTransaction(request),
    onSuccess: invalidate,
  });
}

export function useUpdateTransaction(id: string) {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: (request: TransactionRequest) => updateTransaction(id, request),
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteTransaction(id),
    // Not the whole ['transactions'] prefix: the detail screen is still on screen while it
    // closes, and refetching a deleted record would flash "no longer exists". Its cache entry
    // is collected once the screen is gone.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: LIST_KEY }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]),
  });
}
