import { apiRequest } from '@/api/client';
import type { IsoDate, OccurrenceResponse, TransactionResponse } from '@/types/api';

/** Months of active bills due between two dates, inclusive; optionally one bill's only. */
export function listOccurrences(from: IsoDate, to: IsoDate, billId?: string) {
  return apiRequest<OccurrenceResponse[]>('/occurrences', { query: { from, to, billId } });
}

/**
 * Marks one month paid; the API records its expense, dated `paidOn` (the phone's own today), and
 * returns it. 409 when the month is already paid.
 */
export function payOccurrence(id: string, paidOn: IsoDate) {
  return apiRequest<TransactionResponse>(`/occurrences/${encodeURIComponent(id)}/pay`, {
    method: 'POST',
    body: { paidOn },
  });
}
