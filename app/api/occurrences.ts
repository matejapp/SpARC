import { apiRequest } from '@/api/client';
import type { IsoDate, OccurrenceResponse, TransactionResponse } from '@/types/api';

/** Months of active bills due between two dates, inclusive; optionally one bill's only. */
export function listOccurrences(from: IsoDate, to: IsoDate, billId?: string) {
  return apiRequest<OccurrenceResponse[]>('/occurrences', { query: { from, to, billId } });
}

/** The dashboard's bills: unpaid months overdue or due within 30 days of `today`, overdue first, at most 10. */
export function listUpcoming(today: IsoDate) {
  return apiRequest<OccurrenceResponse[]>('/occurrences/upcoming', { query: { today } });
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
