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

/** OCR on the server takes a few seconds, more on a long receipt. */
const PHOTO_TIMEOUT_MS = 45_000;

/**
 * A photo of a receipt → a draft expense, read by OCR (D-048). `uri` is the camera's file in the
 * app's private cache; it is sent as the multipart field `photo` and never saved anywhere else.
 */
export function draftFromPhoto(uri: string) {
  const form = new FormData();
  // React Native's FormData takes a file as { uri, name, type }; Android needs both name and type.
  form.append('photo', { uri, name: 'receipt.jpg', type: 'image/jpeg' } as unknown as Blob);
  return apiRequest<ReceiptDraftResponse>('/receipts/photo', {
    method: 'POST',
    form,
    timeoutMs: PHOTO_TIMEOUT_MS,
  });
}
