import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { ApiError } from '@/api/client';
import { getSessionStatus, subscribeSession } from '@/lib/session';

// Server state lives in TanStack Query (ARCHITECTURE.md → App structure). Query keys:
//   ['transactions'] list · ['transaction', id] · ['categories', kind] · ['dashboard', from, to] · ['me']
// A change to a transaction invalidates ['transactions'] and ['dashboard'] together.

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // A 4xx will not fix itself; a dropped connection might.
      retry: (failureCount, error) =>
        failureCount < 2 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
    },
  },
});

// Another user may sign in on this phone next: nothing cached may outlive the session.
subscribeSession(() => {
  if (getSessionStatus() === 'signedOut') queryClient.clear();
});

// React Native has no window focus; refetch stale data when the app comes back to the foreground.
AppState.addEventListener('change', (state) => {
  if (Platform.OS !== 'web') focusManager.setFocused(state === 'active');
});
