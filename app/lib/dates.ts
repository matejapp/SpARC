import type { IsoDate } from '@/types/api';

// A transaction's date is a calendar date ("2026-10-31"), not an instant, so it is handled in
// the phone's local calendar and never passed through UTC: new Date("2026-10-31") parses as
// UTC midnight, which is the previous evening west of Greenwich. Names are hand-formatted for
// the same reason money is (lib/money.ts): identical output on every platform.

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** The earliest date the API accepts (TransactionRequest.OccurredOn). */
export const MIN_ENTRY_DATE = new Date(2000, 0, 1);

export function toIsoDate(date: Date): IsoDate {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Local midnight of an ISO date. */
export function fromIsoDate(iso: IsoDate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayIso(): IsoDate {
  return toIsoDate(new Date());
}

function daysBefore(iso: IsoDate, today: IsoDate): number {
  return Math.round((fromIsoDate(today).getTime() - fromIsoDate(iso).getTime()) / 86_400_000);
}

function dayMonth(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** Section heading in the list: "TODAY", "YESTERDAY", "TUE, 27 OCT" (year added when not this year). */
export function dayHeading(iso: IsoDate, today = todayIso()): string {
  const ago = daysBefore(iso, today);
  if (ago === 0) return 'TODAY';
  if (ago === 1) return 'YESTERDAY';
  const date = fromIsoDate(iso);
  const year = iso.slice(0, 4) === today.slice(0, 4) ? '' : ` ${date.getFullYear()}`;
  return `${DAYS[date.getDay()]}, ${dayMonth(date)}${year}`.toUpperCase();
}

/** The date row in the form: "Today, Sat 31 Oct", "Tue 27 Oct", "Mon 3 Mar 2025". */
export function dateLabel(iso: IsoDate, today = todayIso()): string {
  const date = fromIsoDate(iso);
  const ago = daysBefore(iso, today);
  const year = iso.slice(0, 4) === today.slice(0, 4) ? '' : ` ${date.getFullYear()}`;
  const plain = `${DAYS[date.getDay()]} ${dayMonth(date)}${year}`;
  if (ago === 0) return `Today, ${plain}`;
  if (ago === 1) return `Yesterday, ${plain}`;
  return plain;
}

/** Short relative day for a row caption: "Today", "Yesterday", "27 Oct". */
export function shortDay(iso: IsoDate, today = todayIso()): string {
  const ago = daysBefore(iso, today);
  if (ago === 0) return 'Today';
  if (ago === 1) return 'Yesterday';
  return dayMonth(fromIsoDate(iso));
}

/** This calendar month on the phone, both ends inclusive, sent explicitly to the API (D-025). */
export function currentMonth(now = new Date()): { from: IsoDate; to: IsoDate; label: string; name: string } {
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: toIsoDate(first),
    to: toIsoDate(last),
    label: `${MONTHS[now.getMonth()].toUpperCase()} ${now.getFullYear()}`,
    name: MONTHS_LONG[now.getMonth()],
  };
}
