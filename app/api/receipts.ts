import { apiRequest } from '@/api/client';
import type { ReceiptDraftResponse } from '@/types/api';

/** The API refuses longer text; the camera never needs more for a fiscal receipt's link. */
export const MAX_QR_TEXT_LENGTH = 2048;

/** A fiscal receipt's number, "requestedBy-signedBy-counter" — the API's own pattern (D-047). */
export function isReceiptNumber(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Z0-9]{8}-[A-Z0-9]{8}-\d{1,10}$/.test(value);
}

/** The text of a scanned QR code → a draft expense. The API reads it and checks it (D-045). */
export function draftFromQr(text: string) {
  return apiRequest<ReceiptDraftResponse>('/receipts/qr', { method: 'POST', body: { text } });
}
