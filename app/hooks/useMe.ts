import { useQuery } from '@tanstack/react-query';

import { getMe } from '@/api/users';

// A custom hook ("use…") is a function that calls other hooks, so screens share one cached
// query instead of each fetching the account. The account rarely changes within a session.
export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: getMe, staleTime: 5 * 60_000 });
}
