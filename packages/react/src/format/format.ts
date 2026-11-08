import { parseISODate } from "../internal/date";
import { DEFAULT_LOCALE } from "../internal/messages";

/**
 * Locale-aware formatting on Intl (decision D-13). Pure and server-safe: on the client, pass
 * `useLocale()`. Formatters are cached per locale and options, since constructing one is the slow
 * part.
 */
type Formatter =
  | Intl.NumberFormat
  | Intl.RelativeTimeFormat
  | Intl.DateTimeFormat
  | Intl.ListFormat
  | DurationFormatLike;
const cache = new Map<string, Formatter>();

function cached<T extends Formatter>(key: string, create: () => T): T {
  let formatter = cache.get(key) as T | undefined;
  if (!formatter) {
    formatter = create();
    cache.set(key, formatter);
  }
  return formatter;
}

/** A number in the locale's digits and grouping: 1234567 → "12,34,567" in `en-IN`. */
export function formatNumber(
  value: number,
  locale: string = DEFAULT_LOCALE,
  options: Intl.NumberFormatOptions = {},
): string {
  const key = `n|${locale}|${JSON.stringify(options)}`;
  return cached(key, () => new Intl.NumberFormat(locale, options)).format(value);
}

/**
 * An amount of money: `formatCurrency(124500, "INR")` → "₹1,24,500.00". Whole amounts can drop the
 * decimals with `{ maximumFractionDigits: 0 }`.
 */
export function formatCurrency(
  value: number,
  currency: string,
  locale: string = DEFAULT_LOCALE,
  options: Intl.NumberFormatOptions = {},
): string {
  return formatNumber(value, locale, { style: "currency", currency, ...options });
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** How `formatDuration` writes each unit; the examples are `en-IN`. */
export type DurationStyle = "long" | "short" | "narrow";

/** Options for `formatDuration`. */
export interface FormatDurationOptions {
  /** "1 hour, 5 minutes" (`long`, the default), "1 hr, 5 mins" (`short`) or "1h 5m" (`narrow`). */
  style?: DurationStyle;
}

/** `Intl.DurationFormat`, which TypeScript's ES2023 library doesn't declare yet. */
interface DurationFormatLike {
  format(duration: Partial<Record<"days" | "hours" | "minutes" | "seconds", number>>): string;
}
type DurationFormatConstructor = new (
  locale: string,
  options: { style: DurationStyle },
) => DurationFormatLike;

const DURATION_UNITS = [
  ["days", "day", DAY],
  ["hours", "hour", HOUR],
  ["minutes", "minute", MINUTE],
  ["seconds", "second", SECOND],
] as const;

/**
 * A length of time in its non-zero units, largest first — days, hours, minutes, seconds — joined as
 * the locale lists them: `formatDuration(3_900_000)` → "1 hour, 5 minutes"; in Hindi (`hi-IN`) "1
 * घंटा और 5 मिनट". Takes milliseconds; a part of a second is dropped, a negative length
 * is written as its length, and under a second is "0 seconds". `Intl.DurationFormat` writes it where
 * the browser has it, and the same units through `Intl.NumberFormat` and `Intl.ListFormat` where it
 * doesn't, which read alike. Android's and iOS's `QeetrixFormat.duration` write the same text.
 */
export function formatDuration(
  milliseconds: number,
  locale: string = DEFAULT_LOCALE,
  options: FormatDurationOptions = {},
): string {
  const style = options.style ?? "long";
  let rest = Math.abs(milliseconds);
  const parts: [(typeof DURATION_UNITS)[number][0], (typeof DURATION_UNITS)[number][1], number][] =
    [];
  for (const [field, unit, length] of DURATION_UNITS) {
    const count = Math.floor(rest / length);
    rest -= count * length;
    if (count > 0) parts.push([field, unit, count]);
  }
  const unit = (name: string, value: number) =>
    formatNumber(value, locale, { style: "unit", unit: name, unitDisplay: style });
  if (parts.length === 0) return unit("second", 0);
  const DurationFormat = (Intl as unknown as { DurationFormat?: DurationFormatConstructor })
    .DurationFormat;
  if (DurationFormat) {
    const formatter = cached(`d|${locale}|${style}`, () => new DurationFormat(locale, { style }));
    return formatter.format(Object.fromEntries(parts.map(([field, , count]) => [field, count])));
  }
  const list = cached(
    `l|${locale}|${style}`,
    () => new Intl.ListFormat(locale, { type: "unit", style }),
  );
  return list.format(parts.map(([, name, count]) => unit(name, count)));
}

/**
 * Each unit, its length, and how many of it make the next: a month is 30 days, so 4 weeks are not
 * yet a month and 5 are; 12 months make a year.
 */
const UNITS: [Intl.RelativeTimeFormatUnit, number, number][] = [
  ["second", SECOND, 60],
  ["minute", MINUTE, 60],
  ["hour", HOUR, 24],
  ["day", DAY, 7],
  ["week", 7 * DAY, 30 / 7],
  ["month", 30 * DAY, 12],
  ["year", 365 * DAY, Number.POSITIVE_INFINITY],
];

/**
 * How long ago or how soon, in the largest whole unit: "2 minutes ago", "in 3 days", "yesterday".
 * It rounds first and then picks the unit, so 59 minutes 40 seconds is "1 hour ago", not "60
 * minutes ago", and 364 days is "last year", not "12 months ago". `now` is a parameter so server and
 * client render the same text.
 */
export function formatRelativeTime(
  date: Date | number,
  locale: string = DEFAULT_LOCALE,
  now: Date | number = Date.now(),
): string {
  const delta = Number(date) - Number(now);
  const formatter = cached(
    `r|${locale}`,
    () => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }),
  );
  for (const [unit, size, next] of UNITS) {
    // Rounded on the magnitude, so the past and the future round alike (Math.round(-1.5) is -1).
    const amount = Math.round(Math.abs(delta) / size);
    if (amount < next) return formatter.format(amount === 0 ? 0 : Math.sign(delta) * amount, unit);
  }
  return formatter.format(0, "second");
}

/** Options for `formatDate`. */
export interface FormatDateOptions {
  /**
   * How much of the date to write: `short` "25/10/26", `medium` "25 Oct 2026" or `long` "25
   * October 2026" in `en-IN`. Default `medium`.
   */
  dateStyle?: "short" | "medium" | "long";
  /**
   * The IANA time zone a moment is shown in: a `Date`, a timestamp, or a date-time with `Z` or an
   * offset. A "YYYY-MM-DD" date, or a date-time without an offset, has no zone and shows as written.
   * Fixed rather than the runtime's own, so server and client render the same text: pass the
   * user's zone where you know it. Default `Asia/Kolkata`.
   */
  timeZone?: string;
}

/** Options for `formatDateTime`. */
export interface FormatDateTimeOptions extends FormatDateOptions {
  /** How much of the time to write: `short` "2:30 pm" or `medium` "2:30:45 pm". Default `short`. */
  timeStyle?: "short" | "medium";
}

const DEFAULT_TIME_ZONE = "Asia/Kolkata";

/** "2026-10-25T14:30", with optional seconds, fraction, and `Z` or an offset ("+05:30", "+0530"). */
const DATE_TIME =
  /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:?\d{2})?$/i;

/** What a value means: a moment in time, a wall-clock date-time, or a calendar date. */
interface Moment {
  kind: "instant" | "plain-date-time" | "plain-date";
  time: number;
}

function read(value: Date | number | string): Moment | null {
  if (typeof value !== "string") {
    const time = Number(value);
    return Number.isFinite(time) ? { kind: "instant", time } : null;
  }
  const trimmed = value.trim();
  const date = parseISODate(trimmed);
  if (date) return { kind: "plain-date", time: Date.UTC(date.year, date.month - 1, date.day) };
  const match = DATE_TIME.exec(trimmed);
  const day = parseISODate(match?.[1]);
  if (!match || !day) return null;
  const [hour, minute, second] = [Number(match[2]), Number(match[3]), Number(match[4] ?? 0)];
  if (hour > 23 || minute > 59 || second > 59) return null;
  const millisecond = Number((match[5] ?? "").padEnd(3, "0").slice(0, 3));
  const wall = Date.UTC(day.year, day.month - 1, day.day, hour, minute, second, millisecond);
  const zone = match[6]?.toUpperCase();
  if (zone === undefined) return { kind: "plain-date-time", time: wall };
  if (zone === "Z") return { kind: "instant", time: wall };
  const sign = zone.startsWith("-") ? -1 : 1;
  const [offsetHours, offsetMinutes] = [Number(zone.slice(1, 3)), Number(zone.slice(-2))];
  if (offsetHours > 23 || offsetMinutes > 59) return null;
  return { kind: "instant", time: wall - sign * (offsetHours * HOUR + offsetMinutes * MINUTE) };
}

function formatMoment(
  value: Date | number | string,
  locale: string,
  options: FormatDateTimeOptions,
  withTime: boolean,
): string {
  const moment = read(value);
  if (!moment) return "";
  const dateStyle = options.dateStyle ?? "medium";
  // A calendar date has no time to show; it never borrows midnight.
  const timeStyle = withTime && moment.kind !== "plain-date" ? (options.timeStyle ?? "short") : "";
  // Plain values are UTC wall times, shown in UTC: exactly as written, in any zone.
  const timeZone = moment.kind === "instant" ? (options.timeZone ?? DEFAULT_TIME_ZONE) : "UTC";
  const formatter = cached(
    `d|${locale}|${dateStyle}|${timeStyle}|${timeZone}`,
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle,
        ...(timeStyle ? { timeStyle } : {}),
        // Gregorian, so a locale whose default calendar differs (Thai Buddhist, Persian) can't
        // relabel the year.
        calendar: "gregory",
        timeZone,
      }),
  );
  return formatter.format(moment.time);
}

/**
 * A date in the locale's words: `formatDate("2026-10-25")` → "25 Oct 2026"; in Hindi (`hi-IN`) "25
 * अक्टू॰ 2026". Takes a `Date`, a timestamp, a "YYYY-MM-DD" date or an ISO date-time. A
 * "YYYY-MM-DD" date is a calendar date, so no time zone can move it to another day. Always
 * Gregorian. An invalid value gives "".
 */
export function formatDate(
  value: Date | number | string,
  locale: string = DEFAULT_LOCALE,
  options: FormatDateOptions = {},
): string {
  return formatMoment(value, locale, options, false);
}

/**
 * A date and time in the locale's words: "25 Oct 2026, 2:30 pm"; in Hindi (`hi-IN`) "25 अक्टू॰
 * 2026, 2:30 pm". Takes what `formatDate` takes; a moment shows in `timeZone` (default
 * `Asia/Kolkata`). A "YYYY-MM-DD" date has no time, so it shows as `formatDate` writes it. Always
 * Gregorian. An invalid value gives "".
 */
export function formatDateTime(
  value: Date | number | string,
  locale: string = DEFAULT_LOCALE,
  options: FormatDateTimeOptions = {},
): string {
  return formatMoment(value, locale, options, true);
}

/** Options for `formatTime`. */
export interface FormatTimeOptions {
  /** How much of the time to write: `short` "2:30 pm" or `medium` "2:30:45 pm". Default `short`. */
  timeStyle?: "short" | "medium";
  /**
   * The IANA time zone a moment is shown in, as `formatDateTime`'s. A time of day ("14:30"), or a
   * date-time without an offset, has no zone and shows as written. Default `Asia/Kolkata`.
   */
  timeZone?: string;
  /**
   * The clock: `h23` writes "14:30" and `h12` "2:30 pm", in any locale. Leave it out for the
   * locale's own clock; pass the person's 12- or 24-hour setting where you know it, as the phones
   * pass theirs.
   */
  hourCycle?: "h12" | "h23";
}

/** "14:30", with optional seconds and fraction: a time of day, with no date and no zone. */
const TIME_OF_DAY = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?$/;

function readTime(value: Date | number | string): Moment | null {
  const match = typeof value === "string" ? TIME_OF_DAY.exec(value.trim()) : null;
  if (!match) return read(value);
  const [hour, minute, second] = [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)];
  if (hour > 23 || minute > 59 || second > 59) return null;
  const millisecond = Number((match[4] ?? "").padEnd(3, "0").slice(0, 3));
  return { kind: "plain-date-time", time: Date.UTC(1970, 0, 1, hour, minute, second, millisecond) };
}

/**
 * A time of day in the locale's words, without its date: `formatTime("2026-10-25T05:17:09Z")` →
 * "10:47 am" in `en-IN`, the time `formatDateTime` writes. Takes what `formatDateTime` takes, or a
 * time of day ("14:30", "14:30:45"); a moment shows in `timeZone` (default `Asia/Kolkata`).
 * `hourCycle` follows a person's 12- or 24-hour setting. The same text as Qeetrix for Android's
 * `QeetrixFormat.time`. A "YYYY-MM-DD" date has no time, and gives "", as an invalid value does.
 */
export function formatTime(
  value: Date | number | string,
  locale: string = DEFAULT_LOCALE,
  options: FormatTimeOptions = {},
): string {
  const moment = readTime(value);
  if (!moment || moment.kind === "plain-date") return "";
  const timeStyle = options.timeStyle ?? "short";
  // Plain values are UTC wall times, shown in UTC: exactly as written, in any zone.
  const timeZone = moment.kind === "instant" ? (options.timeZone ?? DEFAULT_TIME_ZONE) : "UTC";
  const hourCycle = options.hourCycle;
  const formatter = cached(
    `t|${locale}|${timeStyle}|${timeZone}|${hourCycle ?? ""}`,
    () =>
      new Intl.DateTimeFormat(locale, {
        timeStyle,
        ...(hourCycle ? { hourCycle } : {}),
        calendar: "gregory",
        timeZone,
      }),
  );
  return formatter.format(moment.time);
}
