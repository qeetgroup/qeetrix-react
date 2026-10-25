/**
 * Calendar dates without a time or a time zone, as ISO strings ("2026-10-25"). The arithmetic runs
 * on UTC midnights, so no daylight-saving change or local time zone can shift a day. Gregorian only.
 */

/** A calendar date: year, month (1–12) and day. */
export interface DateParts {
  year: number;
  month: number;
  day: number;
}

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Read "YYYY-MM-DD"; anything else, including 31 February, is `null`. */
export function parseISODate(value: string | null | undefined): DateParts | null {
  const match = value ? ISO.exec(value) : null;
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? { year, month, day }
    : null;
}

const pad = (value: number, width = 2) => String(value).padStart(width, "0");

/** Write "YYYY-MM-DD". */
export function toISODate({ year, month, day }: DateParts): string {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

/** The UTC midnight of a date, for arithmetic and for formatting with `timeZone: "UTC"`. */
export function toUTC({ year, month, day }: DateParts): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

const fromUTC = (date: Date): DateParts => ({
  year: date.getUTCFullYear(),
  month: date.getUTCMonth() + 1,
  day: date.getUTCDate(),
});

/** Days in a month (1–12). */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** The date `days` later (or earlier, when negative). */
export function addDays(date: DateParts, days: number): DateParts {
  const next = toUTC(date);
  next.setUTCDate(next.getUTCDate() + days);
  return fromUTC(next);
}

/** The same day `months` later, or the month's last day when it's shorter (31 Jan + 1 → 28/29 Feb). */
export function addMonths(date: DateParts, months: number): DateParts {
  const index = date.year * 12 + (date.month - 1) + months;
  return dayIn(Math.floor(index / 12), (index % 12) + 1, date.day);
}

/** Negative, zero or positive, as `a` is before, the same as or after `b`. */
export function compareDates(a: DateParts, b: DateParts): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

/** A date kept inside a range; either end may be open. */
export function clampDate(
  date: DateParts,
  min: DateParts | null,
  max: DateParts | null,
): DateParts {
  if (min && compareDates(date, min) < 0) return min;
  if (max && compareDates(date, max) > 0) return max;
  return date;
}

/** Whether every day from `first` to `last` is outside a range; either end may be open. */
export function isOutside(
  first: DateParts,
  last: DateParts,
  min: DateParts | null,
  max: DateParts | null,
): boolean {
  return (
    (min !== null && compareDates(last, min) < 0) || (max !== null && compareDates(first, max) > 0)
  );
}

/** A day in a month, or the month's last day when it's shorter. */
export function dayIn(year: number, month: number, day: number): DateParts {
  return { year, month, day: Math.min(day, daysInMonth(year, month)) };
}

/** The weekday, 0 = Sunday … 6 = Saturday. */
export function weekday(date: DateParts): number {
  return toUTC(date).getUTCDay();
}

/** The views of a calendar: a month's days, a year's months, or a decade's years. */
export type CalendarView = "day" | "month" | "year";

/**
 * Where a key moves a calendar's focus, or `null` for keys it leaves alone. Days: arrows by day and
 * week (mirrored right-to-left), Home and End to the week's ends (it starts on `firstDay`), Page Up
 * and Page Down by month, with Shift by year. Months and years sit in rows of three: arrows by one
 * and by a row, Home and End to the row's ends, Page Up and Page Down by a year or a decade.
 */
export function keyTarget(
  view: CalendarView,
  key: string,
  shift: boolean,
  focused: DateParts,
  firstDay: number,
  rtl: boolean,
): DateParts | null {
  const step = rtl ? -1 : 1;
  if (view === "day") {
    const offset = (weekday(focused) - firstDay + 7) % 7;
    const days: Record<string, number> = {
      ArrowLeft: -step,
      ArrowRight: step,
      ArrowUp: -7,
      ArrowDown: 7,
      Home: -offset,
      End: 6 - offset,
    };
    const pages: Record<string, number> = { PageUp: -1, PageDown: 1 };
    if (key in days) return addDays(focused, days[key] ?? 0);
    return key in pages ? addMonths(focused, (pages[key] ?? 0) * (shift ? 12 : 1)) : null;
  }
  // A step is a month or a year, a page a year or a decade; a decade's page starts a year early.
  const unit = view === "month" ? 1 : 12;
  const column =
    (view === "month" ? focused.month - 1 : focused.year - Math.floor(focused.year / 10) * 10 + 1) %
    3;
  const page = view === "month" ? 12 : 10;
  const steps: Record<string, number> = {
    ArrowLeft: -step,
    ArrowRight: step,
    ArrowUp: -3,
    ArrowDown: 3,
    Home: -column,
    End: 2 - column,
    PageUp: -page,
    PageDown: page,
  };
  return key in steps ? addMonths(focused, (steps[key] ?? 0) * unit) : null;
}

/** Today in the browser's own time zone. */
export function today(): DateParts {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

/** Regions whose weeks start on Sunday (CLDR), for browsers without `Intl.Locale` week info. */
const SUNDAY_FIRST = new Set([
  "IN",
  "US",
  "CA",
  "JP",
  "KR",
  "CN",
  "TW",
  "HK",
  "IL",
  "BR",
  "MX",
  "PH",
  "PK",
  "BD",
  "NP",
  "ZA",
  "SA",
]);

/** The weekday a locale's week starts on, 0 = Sunday … 6 = Saturday. India: Sunday. */
export function firstDayOfWeek(locale: string): number {
  try {
    const intl = new Intl.Locale(locale) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    const info = intl.getWeekInfo?.() ?? intl.weekInfo;
    if (info) return info.firstDay % 7;
    return SUNDAY_FIRST.has(intl.maximize().region ?? "") ? 0 : 1;
  } catch {
    return 1;
  }
}

const formats = new Map<string, Intl.DateTimeFormat>();
/** A cached `Intl.DateTimeFormat` for our dates: always Gregorian, at UTC midnight. */
export function dateFormat(
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = formats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, { ...options, calendar: "gregory", timeZone: "UTC" });
    formats.set(key, format);
  }
  return format;
}

/**
 * The locale's all-number date format ("25/10/2026" for India, "10/25/2026" for the US), in Latin
 * digits so that what a field shows can be typed back.
 */
const numericFormat = (locale: string) =>
  dateFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    numberingSystem: "latn",
  });

/** The order a locale writes a date's parts in: India day, month, year; the US month, day, year. */
export function dateOrder(locale: string): Array<"day" | "month" | "year"> {
  return numericFormat(locale)
    .formatToParts(Date.UTC(2026, 9, 25))
    .map((part) => part.type)
    .filter(
      (type): type is "day" | "month" | "year" =>
        type === "day" || type === "month" || type === "year",
    );
}

/** A date in the locale's all-number form: "2026-10-25" → "25/10/2026" for India. */
export function formatLocalDate(iso: string, locale: string): string {
  const date = parseISODate(iso);
  return date ? numericFormat(locale).format(toUTC(date)) : "";
}

/**
 * Read a typed date: ISO, or three numbers in the locale's order with any separator ("25/10/2026",
 * "5-3-26", "25.10.2026" for India). Years have four digits or two (20xx). Impossible dates are
 * `null`.
 */
export function parseLocalDate(text: string, locale: string): string | null {
  // Some locales mark their separators with invisible direction marks; a typed date needn't.
  const trimmed = text.replace(/[\u061c\u200e\u200f]/g, "").trim();
  if (parseISODate(trimmed)) return trimmed;
  const numbers = trimmed.match(/\d+/g);
  if (numbers?.length !== 3 || /[^\d\s/.-]/.test(trimmed)) return null;
  const parts = { day: 0, month: 0, year: 0 };
  for (const [index, type] of dateOrder(locale).entries()) {
    const digits = numbers[index] ?? "";
    if (type === "year" ? digits.length !== 2 && digits.length !== 4 : digits.length > 2)
      return null;
    parts[type] = Number(digits) + (type === "year" && digits.length === 2 ? 2000 : 0);
  }
  const iso = toISODate(parts);
  return parseISODate(iso) ? iso : null;
}

/** A range of calendar dates, both ends included, "YYYY-MM-DD", `start` never after `end`. */
export interface DateRange {
  /** The first day, "YYYY-MM-DD". */
  start: string;
  /** The last day, "YYYY-MM-DD", never before `start`. */
  end: string;
}

/** The ranges DateRangePicker offers by name, worked out from today; the labels are in the catalogue. */
export type DateRangePresetName =
  | "today"
  | "last7Days"
  | "last30Days"
  | "last90Days"
  | "thisMonth"
  | "lastMonth";

/** How many days the "last …" ranges run back, today included. */
const RANGE_DAYS: Partial<Record<DateRangePresetName, number>> = {
  today: 1,
  last7Days: 7,
  last30Days: 30,
  last90Days: 90,
};

/**
 * A named range on a given day: "last7Days" is the 7 days ending today, today included;
 * "thisMonth" and "lastMonth" are whole calendar months.
 */
export function namedRange(name: DateRangePresetName, today: DateParts): DateRange {
  const days = RANGE_DAYS[name];
  if (days) return { start: toISODate(addDays(today, 1 - days)), end: toISODate(today) };
  const { year, month } = addMonths(today, name === "lastMonth" ? -1 : 0);
  return {
    start: toISODate({ year, month, day: 1 }),
    end: toISODate({ year, month, day: daysInMonth(year, month) }),
  };
}

/** The part of a range inside `min` and `max`, or `null` when none of it is. */
export function clampRange(
  range: DateRange,
  min: string | undefined,
  max: string | undefined,
): DateRange | null {
  const start = min && range.start < min ? min : range.start;
  const end = max && range.end > max ? max : range.end;
  return start <= end ? { start, end } : null;
}

/** A range in the locale's all-number form, joined by an en dash: "01/12/2026 – 31/12/2026". */
export function formatLocalRange(range: DateRange | null, locale: string): string {
  return range
    ? `${formatLocalDate(range.start, locale)} – ${formatLocalDate(range.end, locale)}`
    : "";
}

/**
 * Read a typed range: six numbers, two dates in the locale's order or ISO, with any separators
 * ("1/12/26 - 31/12/26", "01.12.2026 – 31.12.2026"). Ends typed the wrong way round are swapped.
 */
export function parseLocalRange(text: string, locale: string): DateRange | null {
  const numbers = text.match(/\d+/g);
  if (numbers?.length !== 6 || /[^\d\s/.\-–—؜‎‏]/.test(text)) return null;
  const [start, end] = [numbers.slice(0, 3), numbers.slice(3)].map(([a = "", b = "", c = ""]) =>
    parseLocalDate(
      a.length === 4 ? `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}` : `${a}/${b}/${c}`,
      locale,
    ),
  );
  if (!start || !end) return null;
  return start <= end ? { start, end } : { start: end, end: start };
}
