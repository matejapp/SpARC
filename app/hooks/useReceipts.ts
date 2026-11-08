import { useMutation } from '@tanstack/react-query';

import { draftFromPhoto, draftFromQr } from '@/api/receipts';

/**
 * A scan's draft. A mutation, not a query: each scan is one request the user started, and
 * nothing it returns is cached or shared — the draft goes straight into the add form.
 */
export function useReceiptDraft() {
  return useMutation({ mutationFn: (text: string) => draftFromQr(text) });
}

/** A photo's draft, read by OCR on the server (D-048). Same reasoning: one request, no cache. */
export function useReceiptPhotoDraft() {
  return useMutation({ mutationFn: (uri: string) => draftFromPhoto(uri) });
}
