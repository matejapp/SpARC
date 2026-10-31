import { apiRequest } from '@/api/client';
import type { CategoryResponse, TransactionType } from '@/types/api';

/** The shared system set plus the user's own (D-015), optionally one kind only. */
export function listCategories(kind?: TransactionType): Promise<CategoryResponse[]> {
  return apiRequest<CategoryResponse[]>('/categories', { query: { kind } });
}
