// ISO 8601 week numbering (weeks start Monday; week 1 is the week containing the
// first Thursday of the year / the year's 4th of January). Also a US-style week
// number (weeks start Sunday, week 1 contains Jan 1) for comparison.

export interface WeekInfo {
  isoYear: number;
  isoWeek: number;
  isoWeekday: number; // 1 = Monday … 7 = Sunday
  usWeek: number; // Sunday-start, week 1 = the one with Jan 1
  dayOfYear: number;
  weeksInIsoYear: number;
  quarter: number;
  mondayOfWeek: Date;
  sundayOfWeek: Date;
}

function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isoWeek(date: Date): { year: number; week: number } {
  const d = atMidnight(date);
  // Thursday in current week decides the year
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day + 3);
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const ft = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - ft + 3);
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return { year: d.getFullYear(), week };
}

export function weeksInYear(isoYr: number): number {
  // 53 weeks if Jan 1 is Thursday, or Wednesday in a leap year
  const jan1 = new Date(isoYr, 0, 1).getDay();
  const isLeap = (isoYr % 4 === 0 && isoYr % 100 !== 0) || isoYr % 400 === 0;
  return jan1 === 4 || (jan1 === 3 && isLeap) ? 53 : 52;
}

function usWeekNumber(date: Date): number {
  const d = atMidnight(date);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((d.getTime() - jan1.getTime()) / 86400000);
  return Math.floor((dayOfYear + jan1.getDay()) / 7) + 1;
}

export function analyse(date: Date): WeekInfo {
  const d = atMidnight(date);
  const iso = isoWeek(d);
  const isoWeekday = ((d.getDay() + 6) % 7) + 1;

  const monday = new Date(d);
  monday.setDate(d.getDate() - (isoWeekday - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const jan1 = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((d.getTime() - jan1.getTime()) / 86400000) + 1;

  return {
    isoYear: iso.year,
    isoWeek: iso.week,
    isoWeekday,
    usWeek: usWeekNumber(d),
    dayOfYear,
    weeksInIsoYear: weeksInYear(iso.year),
    quarter: Math.floor(d.getMonth() / 3) + 1,
    mondayOfWeek: monday,
    sundayOfWeek: sunday,
  };
}

// Weeks (ISO) covering a given month, for the mini calendar.
export interface CalWeek {
  week: number;
  days: (Date | null)[]; // 7 entries, Mon..Sun; null when outside the month
}

export function monthWeeks(year: number, month: number): CalWeek[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startOffset = (first.getDay() + 6) % 7; // days before the 1st in that week row
  const rows: CalWeek[] = [];
  let cursor = new Date(year, month, 1 - startOffset);
  while (cursor <= last || (cursor.getDay() + 6) % 7 !== 0) {
    const days: (Date | null)[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(cursor.getMonth() === month ? new Date(cursor) : null);
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    }
    rows.push({ week: isoWeek(days.find(Boolean) ?? new Date(year, month, 15)).week, days });
    if (rows.length > 6) break;
  }
  return rows;
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function fromISODate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}
