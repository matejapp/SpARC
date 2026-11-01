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

/** 1 → "1st", 22 → "22nd", 13 → "13th": the day of the month an ISO date falls on. */
export function dayOrdinal(iso: IsoDate): string {
  const day = fromIsoDate(iso).getDate();
  const teen = day % 100 >= 11 && day % 100 <= 13;
  const suffix = teen ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[day % 10] ?? 'th';
  return `${day}${suffix}`;
}

/**
 * The dates a bill's first due date may take: today up to a year ahead, the schedule's horizon
 * (D-034). The API allows a day of slack at both ends for the phone's time zone.
 */
export function billDueDateRange(now = new Date()): { min: Date; max: Date } {
  return {
    min: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    max: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
  };
}

/** Due-date caption: "Today", "Tomorrow", "10 Nov" ("10 Nov 2027" in another year). */
export function dueDay(iso: IsoDate, today = todayIso()): string {
  const ago = daysBefore(iso, today);
  if (ago === 0) return 'Today';
  if (ago === -1) return 'Tomorrow';
  if (ago === 1) return 'Yesterday';
  const year = iso.slice(0, 4) === today.slice(0, 4) ? '' : ` ${iso.slice(0, 4)}`;
  return `${dayMonth(fromIsoDate(iso))}${year}`;
}

/** "November" for an ISO date. */
export function monthName(iso: IsoDate): string {
  return MONTHS_LONG[fromIsoDate(iso).getMonth()];
}

// The calendar tab's month: a year and a 0-based month, as Date counts them.
export type Month = { year: number; month: number };

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export function monthOf(now = new Date()): Month {
  return { year: now.getFullYear(), month: now.getMonth() };
}

/** Months later (or earlier, negative); Date rolls the year over. */
export function shiftMonth(m: Month, by: number): Month {
  return monthOf(new Date(m.year, m.month + by, 1));
}

/** First and last day, inclusive, and the title: "November 2026". */
export function monthSpan(m: Month): { from: IsoDate; to: IsoDate; title: string } {
  return {
    from: toIsoDate(new Date(m.year, m.month, 1)),
    to: toIsoDate(new Date(m.year, m.month + 1, 0)),
    title: `${MONTHS_LONG[m.month]} ${m.year}`,
  };
}

/** The month's days in weeks, Monday first; null pads the first and last week. */
export function monthGrid(m: Month): (IsoDate | null)[][] {
  const first = new Date(m.year, m.month, 1);
  const days = new Date(m.year, m.month + 1, 0).getDate();
  const cells: (IsoDate | null)[] = Array((first.getDay() + 6) % 7).fill(null); // Sunday is 0
  for (let d = 1; d <= days; d++) cells.push(toIsoDate(new Date(m.year, m.month, d)));
  while (cells.length % 7) cells.push(null);
  const weeks: (IsoDate | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/**
 * A bill's months on its detail screen: from the 1st, 11 months back, through the 12-month
 * schedule. Stays inside the API's 731-day cap (OccurrenceListQuery).
 */
export function billMonthsRange(now = new Date()): { from: IsoDate; to: IsoDate } {
  return {
    from: toIsoDate(new Date(now.getFullYear(), now.getMonth() - 11, 1)),
    to: toIsoDate(new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())),
  };
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
