import { useQuery } from '@tanstack/react-query';

import { getDashboardSummary } from '@/api/dashboard';
import type { IsoDate } from '@/types/api';

/** Income, expense and the difference for an inclusive period, in RSD. */
export function useSummary(from: IsoDate, to: IsoDate) {
  return useQuery({
    queryKey: ['dashboard', from, to],
    queryFn: () => getDashboardSummary(from, to),
  });
}
