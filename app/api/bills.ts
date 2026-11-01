import { apiRequest } from '@/api/client';
import type { BillRequest, BillResponse, PagedResponse } from '@/types/api';

export const BILLS_PAGE_SIZE = 20;

/** Active bills by name, offset paging (D-024). */
export function listBills(page: number, pageSize = BILLS_PAGE_SIZE) {
  return apiRequest<PagedResponse<BillResponse>>('/bills', { query: { page, pageSize } });
}

export function getBill(id: string) {
  return apiRequest<BillResponse>(`/bills/${encodeURIComponent(id)}`);
}

export function createBill(request: BillRequest) {
  return apiRequest<BillResponse>('/bills', { method: 'POST', body: request });
}

/** Changes reach the upcoming unpaid months only; paid and overdue months stay as they were. */
export function updateBill(id: string, request: BillRequest) {
  return apiRequest<void>(`/bills/${encodeURIComponent(id)}`, { method: 'PUT', body: request });
}

/** Deactivates: unpaid months go, paid months and their expenses stay. */
export function deactivateBill(id: string) {
  return apiRequest<void>(`/bills/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
