import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getMe, updateMe } from '@/api/users';
import type { UpdateUserRequest } from '@/types/api';

// A custom hook ("use…") is a function that calls other hooks, so screens share one cached
// query instead of each fetching the account. The account rarely changes within a session.
export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: getMe, staleTime: 5 * 60_000 });
}

/**
 * Switches the display currency. The answer is the updated account, so ['me'] is written
 * directly; every total shown in that currency is refetched: the dashboard and analytics.
 * Transactions and bills show the currency they were entered in, so they stay cached (D-043).
 */
export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: UpdateUserRequest) => updateMe(request),
    onSuccess: (user) => {
      queryClient.setQueryData(['me'], user);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
