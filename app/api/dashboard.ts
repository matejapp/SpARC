import { apiRequest } from '@/api/client';
import type { DashboardSummaryResponse, IsoDate } from '@/types/api';

/** Totals for an inclusive period, in RSD. The app always sends both dates (D-025). */
export function getDashboardSummary(from: IsoDate, to: IsoDate) {
  return apiRequest<DashboardSummaryResponse>('/dashboard/summary', { query: { from, to } });
}
