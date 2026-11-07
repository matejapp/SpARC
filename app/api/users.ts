import { apiRequest } from '@/api/client';
import type { UpdateUserRequest, UserResponse } from '@/types/api';

/** The signed-in user's own account. */
export function getMe() {
  return apiRequest<UserResponse>('/users/me');
}

/** Changes the signed-in user's own settings; answers with the updated account. */
export function updateMe(request: UpdateUserRequest) {
  return apiRequest<UserResponse>('/users/me', { method: 'PUT', body: request });
}
