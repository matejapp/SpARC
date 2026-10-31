import type { Currency, TransactionType } from '@/types/api';

// The only place an amount becomes text (D-027): sr-Latn grouping, "1.250,50 RSD", always two
// decimals. Hand-rolled rather than Intl.NumberFormat: Hermes ships a reduced Intl on some
// Android builds, and a formatter that differs per platform is worse than eight lines of code.

const MINUS = '−'; // "−", not a hyphen

/** 1250.5 → "1.250,50" (no sign, no currency). */
export function formatAmount(value: number): string {
  const [whole, cents] = Math.abs(value).toFixed(2).split('.');
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${cents}`;
}

/** 1250.5 → "1.250,50 RSD"; a negative value keeps its sign ("−1.250,50 RSD"). */
export function formatMoney(value: number, currency: Currency = 'RSD'): string {
  return `${value < 0 ? MINUS : ''}${formatAmount(value)} ${currency}`;
}

/** A transaction as listed: expenses "−", income "+". Colour is the caller's (ink / income green). */
export function formatSigned(value: number, type: TransactionType, currency: Currency = 'RSD'): string {
  return `${type === 'expense' ? MINUS : '+'}${formatAmount(value)} ${currency}`;
}
