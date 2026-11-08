import { apiRequest } from '@/api/client';
import type { TransactionFilters } from '@/lib/transactionFilters';
import type { Currency, PagedResponse, TransactionRequest, TransactionResponse } from '@/types/api';

export const TRANSACTIONS_PAGE_SIZE = 20;

/** Newest first, offset paging (D-024), narrowed by the filters (D-040). */
export function listTransactions(page: number, filters: TransactionFilters = {}, pageSize = TRANSACTIONS_PAGE_SIZE) {
  return apiRequest<PagedResponse<TransactionResponse>>('/transactions', {
    query: {
      page,
      pageSize,
      type: filters.type,
      from: filters.from,
      to: filters.to,
      categoryId: filters.categoryId,
      uncategorised: filters.uncategorised ? 'true' : undefined,
      currency: filters.currency,
    },
  });
}

/** One transaction; `currency` sets its display amount (D-051), else the preferred currency. */
export function getTransaction(id: string, currency?: Currency) {
  return apiRequest<TransactionResponse>(`/transactions/${encodeURIComponent(id)}`, { query: { currency } });
}

export function createTransaction(request: TransactionRequest) {
  return apiRequest<TransactionResponse>('/transactions', { method: 'POST', body: request });
}

export function updateTransaction(id: string, request: TransactionRequest) {
  return apiRequest<void>(`/transactions/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: request,
  });
}

export function deleteTransaction(id: string) {
  return apiRequest<void>(`/transactions/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
