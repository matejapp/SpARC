import { apiRequest } from '@/api/client';
import type { UserResponse } from '@/types/api';

/** The signed-in user's own account. */
export function getMe() {
  return apiRequest<UserResponse>('/users/me');
}
