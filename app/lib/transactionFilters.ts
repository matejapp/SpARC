import { addDays, currentMonth, isIsoDate, lastMonthSpan, rangeLabel, thisYearSpan } from '@/lib/dates';
import type { Currency, IsoDate, TransactionType } from '@/types/api';

/**
 * The Activity filters (D-040). Every field optional; together they are ANDed by the API. They
 * live in the route's search params (see the Activity screen), so they are parsed from strings.
 */
export type TransactionFilters = {
  type?: TransactionType;
  from?: IsoDate;
  to?: IsoDate;
  categoryId?: string;
  uncategorised?: true;
  currency?: Currency;
};

export type FilterParams = Record<keyof TransactionFilters, string | undefined>;

const CURRENCIES: readonly Currency[] = ['RSD', 'EUR', 'USD'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/**
 * Search params come from the URL — typed by us, but also by any link into the app — so anything
 * that doesn't parse is dropped rather than sent. The API validates again; this keeps a bad link
 * from turning into an error screen.
 */
export function parseFilters(params: Record<string, string | string[] | undefined>): TransactionFilters {
  const f: TransactionFilters = {};
  const type = one(params.type);
  if (type === 'income' || type === 'expense') f.type = type;
  const from = one(params.from);
  const to = one(params.to);
  if (isIsoDate(from) && isIsoDate(to) && from <= to && to <= addDays(from, MAX_SPAN_DAYS)) {
    f.from = from;
    f.to = to;
  }
  const categoryId = one(params.categoryId);
  if (categoryId && UUID.test(categoryId)) f.categoryId = categoryId;
  else if (one(params.uncategorised) === 'true') f.uncategorised = true;
  const currency = one(params.currency)?.toUpperCase();
  if (currency && (CURRENCIES as readonly string[]).includes(currency)) f.currency = currency as Currency;
  return f;
}

/** Every key present, undefined when off: router.setParams removes a param set to undefined. */
export function toParams(f: TransactionFilters): FilterParams {
  return {
    type: f.type,
    from: f.from,
    to: f.to,
    categoryId: f.categoryId,
    uncategorised: f.uncategorised ? 'true' : undefined,
    currency: f.currency,
  };
}

/** The type switch is always visible, so it doesn't count as a chip; Clear all resets it too. */
export function hasChipFilters(f: TransactionFilters): boolean {
  return Boolean(f.from || f.categoryId || f.uncategorised || f.currency);
}

export function hasAnyFilter(f: TransactionFilters): boolean {
  return Boolean(f.type) || hasChipFilters(f);
}

export type PeriodPreset = 'thisMonth' | 'lastMonth' | 'thisYear';

export const PERIOD_PRESETS: readonly { value: PeriodPreset; label: string }[] = [
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'thisYear', label: 'This year' },
];

export function presetRange(preset: PeriodPreset, now = new Date()): { from: IsoDate; to: IsoDate } {
  if (preset === 'thisMonth') {
    const { from, to } = currentMonth(now);
    return { from, to };
  }
  return preset === 'lastMonth' ? lastMonthSpan(now) : thisYearSpan(now);
}

/** Which preset a range is, if any; anything else is a custom range. */
export function matchPreset(from: IsoDate, to: IsoDate, now = new Date()): PeriodPreset | null {
  for (const { value } of PERIOD_PRESETS) {
    const range = presetRange(value, now);
    if (range.from === from && range.to === to) return value;
  }
  return null;
}

export function periodLabel(from: IsoDate, to: IsoDate, now = new Date()): string {
  const preset = matchPreset(from, to, now);
  return preset ? PERIOD_PRESETS.find((p) => p.value === preset)!.label : rangeLabel(from, to, now);
}

/** The API's cap on a range (TransactionListQuery.MaxSpanDays). */
export const MAX_SPAN_DAYS = 731;
