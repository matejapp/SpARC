import { apiRequest } from '@/api/client';
import type { PagedResponse, TransactionRequest, TransactionResponse } from '@/types/api';

export const TRANSACTIONS_PAGE_SIZE = 20;

/** Newest first, offset paging (D-024). */
export function listTransactions(page: number, pageSize = TRANSACTIONS_PAGE_SIZE) {
  return apiRequest<PagedResponse<TransactionResponse>>('/transactions', {
    query: { page, pageSize },
  });
}

export function getTransaction(id: string) {
  return apiRequest<TransactionResponse>(`/transactions/${encodeURIComponent(id)}`);
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
