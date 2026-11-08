import { rangeLabel, toIsoDate } from '@/lib/dates';
import type { IsoDate } from '@/types/api';

// The Analytics tab's period, on the phone's own calendar (D-025): the app always sends both
// dates. The API compares a run of whole months with the same number of months before it, and
// any other period with the same number of days before it (D-042) — so a week is compared with
// the week before, a quarter with the quarter before.

export type PeriodKind = 'week' | 'month' | 'quarter' | 'year';

export type Period = {
  kind: PeriodKind;
  from: IsoDate;
  to: IsoDate;
  /** What the switcher shows: "26 Oct – 1 Nov", "October 2026", "Q4 2026", "2026". */
  title: string;
  /** The period before, as a sentence ends with it: "September", "last week", "Q3", "2025". */
  previousName: string;
  /** For the empty state: "November", "this week", "Q4 2026". */
  name: string;
  /** "2026-10" for a month period (the pace and daily endpoints); null otherwise. */
  month: string | null;
  /** True for the period that holds today; there is nothing later to move to. */
  isCurrent: boolean;
  /** False once the period starts in January 2000, the earliest date the API accepts. */
  canGoBack: boolean;
};

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const EARLIEST = '2000-01-01';

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** The period of `kind` that is `offset` periods before (negative) or at (0) today. */
export function periodAt(kind: PeriodKind, offset: number, now = new Date()): Period {
  const y = now.getFullYear();
  const m = now.getMonth();
  let first: Date;
  let last: Date;
  let title: string;
  let previousName: string;
  let name: string;

  switch (kind) {
    case 'week': {
      const monday = now.getDate() - ((now.getDay() + 6) % 7) + 7 * offset; // Sunday is 0
      first = new Date(y, m, monday);
      last = new Date(y, m, monday + 6);
      title = rangeLabel(toIsoDate(first), toIsoDate(last), now);
      previousName = offset === 0 ? 'last week' : 'the week before';
      name = offset === 0 ? 'this week' : 'that week';
      break;
    }
    case 'month': {
      first = new Date(y, m + offset, 1);
      last = new Date(y, m + offset + 1, 0);
      title = `${MONTHS_LONG[first.getMonth()]} ${first.getFullYear()}`;
      previousName = MONTHS_LONG[new Date(first.getFullYear(), first.getMonth() - 1, 1).getMonth()];
      name = MONTHS_LONG[first.getMonth()];
      break;
    }
    case 'quarter': {
      const start = (Math.floor(m / 3) + offset) * 3; // Date rolls months over into years
      first = new Date(y, start, 1);
      last = new Date(y, start + 3, 0);
      const q = Math.floor(first.getMonth() / 3) + 1;
      title = `Q${q} ${first.getFullYear()}`;
      previousName = q === 1 ? `Q4 ${first.getFullYear() - 1}` : `Q${q - 1}`;
      name = title;
      break;
    }
    case 'year': {
      first = new Date(y + offset, 0, 1);
      last = new Date(y + offset, 11, 31);
      title = String(first.getFullYear());
      previousName = String(first.getFullYear() - 1);
      name = title;
      break;
    }
  }

  const from = toIsoDate(first);
  return {
    kind,
    from,
    to: toIsoDate(last),
    title,
    previousName,
    name,
    month: kind === 'month' ? monthKey(first) : null,
    isCurrent: offset === 0,
    canGoBack: from > EARLIEST,
  };
}

/**
 * The months the income-and-expense and categories-over-time charts span: the period's own
 * months, and at least the six ending with its last month — one month alone would be a single
 * point. A year is 12 months, well inside the API's 731-day cap.
 */
export function chartMonths(period: Period): { from: IsoDate; to: IsoDate } {
  const end = new Date(Number(period.to.slice(0, 4)), Number(period.to.slice(5, 7)) - 1, 1);
  const sixBack = toIsoDate(new Date(end.getFullYear(), end.getMonth() - 5, 1));
  const ownStart = `${period.from.slice(0, 7)}-01`;
  const from = ownStart < sixBack ? ownStart : sixBack;
  return { from: from < EARLIEST ? EARLIEST : from, to: period.to };
}

/** "2026-10" → "Oct", "Oct 26" (`shortYear`), or "October 2026" (`long`). */
export function monthLabel(key: string, style: 'short' | 'shortYear' | 'long' = 'short'): string {
  const year = key.slice(0, 4);
  const index = Number(key.slice(5, 7)) - 1;
  const long = MONTHS_LONG[index];
  if (style === 'long') return `${long} ${year}`;
  const short = long.slice(0, 3);
  return style === 'shortYear' ? `${short} ${year.slice(2)}` : short;
}
