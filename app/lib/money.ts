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

/** Signed for a total that can go negative: "−1.250,50", "48.799,50". */
export function formatSignedAmount(value: number): string {
  return `${value < 0 ? MINUS : ''}${formatAmount(value)}`;
}

/** 1250.5 → "1.250,50 RSD"; a negative value keeps its sign ("−1.250,50 RSD"). */
export function formatMoney(value: number, currency: Currency = 'RSD'): string {
  return `${formatSignedAmount(value)} ${currency}`;
}

/**
 * A transaction as listed: expenses "−", income "+". Rows leave out the currency when it is
 * RSD, as the board draws them; pass one to show it. Colour is the caller's (ink / income green).
 */
export function formatSigned(value: number, type: TransactionType, currency?: Currency): string {
  const text = `${type === 'expense' ? MINUS : '+'}${formatAmount(value)}`;
  return currency ? `${text} ${currency}` : text;
}

/**
 * An exchange rate as the API stores it (up to 6 decimals; NBS publishes 4): 117.3931 →
 * "117,3931". At least 4 decimals, trailing zeros past that dropped — display only, never parsed.
 */
export function formatRate(value: number): string {
  const [whole, decimals] = value.toFixed(6).split('.');
  const shown = decimals.replace(/0+$/, '').padEnd(4, '0');
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${shown}`;
}

// The amount field. The API takes at most 2 decimals and refuses anything over
// 9.999.999.999.999.999,99; the app caps at 13 integer digits, so every accepted value has at
// most 15 significant digits. A JS number carries that exactly, and JSON.stringify writes back
// the same digits the user typed, so the amount crosses to the API's decimal unchanged. The app
// never does arithmetic on it (D-031).
const MAX_INTEGER_DIGITS = 13;

export type AmountParse = { ok: true; value: number } | { ok: false; error: string };

/**
 * Reads what the user typed, sr-Latn first: "1.250,50", "1250,50". A point is also accepted as
 * the decimal mark ("1250.50", what some keyboards offer) unless it groups thousands ("1.250").
 */
export function parseAmount(text: string): AmountParse {
  const raw = text.replace(/[\s\u00A0]/g, '');
  if (!raw) return { ok: false, error: 'Enter an amount.' };

  let whole: string;
  let decimals = '';
  if (raw.includes(',')) {
    // Decimal comma; points may only group thousands.
    const match = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d*))?$/.exec(raw);
    if (!match) return { ok: false, error: 'Enter a number, like 1.250,50.' };
    whole = match[1].replace(/\./g, '');
    decimals = match[2] ?? '';
  } else if (/^\d{1,3}(?:\.\d{3})+$/.test(raw)) {
    whole = raw.replace(/\./g, ''); // "1.250" is one thousand two hundred fifty
  } else {
    const match = /^(\d+)(?:\.(\d*))?$/.exec(raw);
    if (!match) return { ok: false, error: 'Enter a number, like 1.250,50.' };
    whole = match[1];
    decimals = match[2] ?? '';
  }

  if (decimals.length > 2) return { ok: false, error: 'At most 2 decimal places.' };
  const digits = whole.replace(/^0+(?=\d)/, '');
  if (digits.length > MAX_INTEGER_DIGITS) return { ok: false, error: 'That amount is too large.' };

  const value = Number(`${digits}.${decimals || '0'}`);
  if (!(value > 0)) return { ok: false, error: 'Enter an amount greater than zero.' };
  return { ok: true, value };
}
