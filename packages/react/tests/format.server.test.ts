/**
 * The format helpers on the server: relative time rounds before it picks a unit, and dates and
 * date-times read every input the same way in any runtime time zone, always Gregorian.
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  type DurationStyle,
  formatDate,
  formatDateTime,
  formatDuration,
  formatRelativeTime,
  formatTime,
} from "../src/format/format";
import * as entry from "../src/index";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const now = Date.UTC(2026, 9, 25, 12, 0, 0);
const ago = (ms: number) => formatRelativeTime(now - ms, "en-IN", now);
const ahead = (ms: number) => formatRelativeTime(now + ms, "en-IN", now);

describe("formatRelativeTime rounds first, then picks the largest whole unit", () => {
  it("promotes a value that rounds up to the next unit", () => {
    // Regression: the unit was chosen before rounding, so these were "60 minutes ago" and
    // "12 months ago".
    expect(ago(59 * MINUTE + 40 * SECOND)).toBe("1 hour ago");
    expect(ago(364 * DAY)).toBe("last year");
    expect(ago(59.6 * SECOND)).toBe("1 minute ago");
    expect(ago(23 * HOUR + 40 * MINUTE)).toBe("yesterday");
    expect(ago(6.6 * DAY)).toBe("last week");
  });

  it("keeps a value that doesn't reach the next unit in its own", () => {
    expect(ago(59.4 * SECOND)).toBe("59 seconds ago");
    expect(ago(31 * MINUTE)).toBe("31 minutes ago");
    expect(ago(59 * MINUTE + 20 * SECOND)).toBe("59 minutes ago");
    expect(ago(23 * HOUR)).toBe("23 hours ago");
    expect(ago(6 * DAY)).toBe("6 days ago");
    // Four weeks are 28 days, not yet a month (30); five are.
    expect(ago(31 * DAY)).toBe("4 weeks ago");
    expect(ago(32 * DAY)).toBe("last month");
    expect(ago(334 * DAY)).toBe("11 months ago");
    expect(ago(2 * 365 * DAY)).toBe("2 years ago");
  });

  it("rounds the future like the past", () => {
    expect(ahead(59 * MINUTE + 40 * SECOND)).toBe("in 1 hour");
    expect(ahead(364 * DAY)).toBe("next year");
    // Math.round(-1.5) is -1 but Math.round(1.5) is 2: halves round away from now both ways.
    expect(ago(1.5 * HOUR)).toBe("2 hours ago");
    expect(ahead(1.5 * HOUR)).toBe("in 2 hours");
  });

  it("says now for less than half a second either way, and speaks Hindi", () => {
    expect(ago(400)).toBe("now");
    expect(ahead(400)).toBe("now");
    // ICU's Hindi takes the oblique form ("1 घंटे पहले"); older data had "घंटा".
    expect(formatRelativeTime(now - (59 * MINUTE + 40 * SECOND), "hi-IN", now)).toMatch(
      /^1 घंट[ाे] पहले$/,
    );
  });
});

describe("formatDate", () => {
  it("writes a calendar date in India's style by default, in three lengths", () => {
    expect(formatDate("2026-10-25")).toBe("25 Oct 2026");
    expect(formatDate("2026-10-25", "en-IN", { dateStyle: "short" })).toBe("25/10/26");
    expect(formatDate("2026-10-25", "en-IN", { dateStyle: "long" })).toBe("25 October 2026");
    expect(formatDate("2026-10-25", "en-US")).toBe("Oct 25, 2026");
  });

  it("speaks Hindi", () => {
    expect(formatDate("2026-10-25", "hi-IN")).toMatch(/^25 अक्[टत]ू॰ 2026$/);
    expect(formatDate("2026-10-25", "hi-IN", { dateStyle: "long" })).toMatch(/^25 अक्[टत]ूबर 2026$/);
  });

  it("never moves a calendar date to another day, whatever the time zone", () => {
    for (const timeZone of ["Pacific/Kiritimati", "Pacific/Pago_Pago", "UTC"]) {
      expect(formatDate("2026-01-01", "en-IN", { timeZone })).toBe("1 Jan 2026");
    }
  });

  it("shows a moment's date in India's time zone by default, or the zone given", () => {
    // 20:00 UTC on the 25th is 01:30 on the 26th in India.
    const evening = new Date(Date.UTC(2026, 9, 25, 20, 0));
    expect(formatDate(evening)).toBe("26 Oct 2026");
    expect(formatDate(evening.getTime())).toBe("26 Oct 2026");
    expect(formatDate(evening, "en-IN", { timeZone: "UTC" })).toBe("25 Oct 2026");
    expect(formatDate("2026-10-25T20:00:00Z")).toBe("26 Oct 2026");
    expect(formatDate("2026-10-25T20:00:00-05:00")).toBe("26 Oct 2026");
  });

  it("is always Gregorian, even where the locale's own calendar differs", () => {
    expect(formatDate("2026-10-25", "th-TH", { dateStyle: "long" })).toContain("2026");
    expect(formatDate("2026-10-25", "th-TH", { dateStyle: "long" })).not.toContain("2569");
  });

  it("gives an empty string for anything that isn't a date", () => {
    for (const value of ["", "25/10/2026", "2026-02-31", "2026-10-25T25:00", "soon"]) {
      expect(formatDate(value), value).toBe("");
    }
    expect(formatDate(new Date(Number.NaN))).toBe("");
    expect(formatDate(Number.NaN)).toBe("");
  });
});

describe("formatDateTime", () => {
  const moment = "2026-10-25T09:00:00Z";

  it("writes a moment in India's time zone by default, with a short time", () => {
    expect(formatDateTime(moment)).toBe("25 Oct 2026, 2:30 pm");
    expect(formatDateTime(new Date(moment))).toBe("25 Oct 2026, 2:30 pm");
    expect(formatDateTime(moment, "en-IN", { timeZone: "UTC" })).toBe("25 Oct 2026, 9:00 am");
    expect(formatDateTime(moment, "en-IN", { dateStyle: "short", timeStyle: "medium" })).toBe(
      "25/10/26, 2:30:00 pm",
    );
  });

  it("reads offsets with or without a colon, and fractions of a second", () => {
    expect(formatDateTime("2026-10-25T14:30:00+05:30")).toBe("25 Oct 2026, 2:30 pm");
    expect(formatDateTime("2026-10-25T14:30:00+0530")).toBe("25 Oct 2026, 2:30 pm");
    expect(formatDateTime("2026-10-25T09:00:00.123456Z")).toBe("25 Oct 2026, 2:30 pm");
  });

  it("shows a date-time without an offset as written, and a calendar date without a time", () => {
    expect(formatDateTime("2026-10-25T14:30", "en-IN", { timeZone: "America/New_York" })).toBe(
      "25 Oct 2026, 2:30 pm",
    );
    expect(formatDateTime("2026-10-25")).toBe("25 Oct 2026");
  });

  it("speaks Hindi", () => {
    expect(formatDateTime(moment, "hi-IN")).toMatch(/^25 अक्[टत]ू॰ 2026, .*2:30/);
  });

  it("gives an empty string for anything that isn't a date", () => {
    expect(formatDateTime("2026-10-25T14:60")).toBe("");
    expect(formatDateTime("2026-10-25T14:30+25:00")).toBe("");
  });
});

describe("the entry point", () => {
  it("exports the date formatters beside the others", () => {
    expect(entry.formatDate).toBe(formatDate);
    expect(entry.formatDateTime).toBe(formatDateTime);
  });
});

/**
 * The cases qeetrix-android checks its QeetrixFormat.duration against (Tools/FormatCases, Node's
 * Intl.DurationFormat, ICU 78.2, CLDR 48), so the web and the phones write a duration alike:
 * [locale, seconds, style, text].
 */
const DURATION_CASES: [string, number, DurationStyle, string][] = [
  ["en-IN", 3900, "long", "1 hour, 5 minutes"],
  ["en-IN", 172803, "long", "2 days, 3 seconds"],
  ["en-IN", 45, "long", "45 seconds"],
  ["en-IN", 90061, "long", "1 day, 1 hour, 1 minute, 1 second"],
  ["en-IN", 3900, "short", "1 hr, 5 mins"],
  ["en-IN", 172803, "short", "2 days, 3 secs"],
  ["en-IN", 45, "short", "45 secs"],
  ["en-IN", 90061, "short", "1 day, 1 hr, 1 min, 1 sec"],
  ["en-IN", 3900, "narrow", "1h 5m"],
  ["en-IN", 172803, "narrow", "2d 3s"],
  ["en-IN", 45, "narrow", "45s"],
  ["en-IN", 90061, "narrow", "1d 1h 1m 1s"],
  ["hi-IN", 3900, "long", "1 घंटा और 5 मिनट"],
  ["hi-IN", 172803, "long", "2 दिन और 3 सेकंड"],
  ["hi-IN", 45, "long", "45 सेकंड"],
  ["hi-IN", 90061, "long", "1 दिन, 1 घंटा, 1 मिनट, और 1 सेकंड"],
  ["hi-IN", 3900, "short", "1 घं॰, 5 मि॰"],
  ["hi-IN", 172803, "short", "2 दिन, 3 से॰"],
  ["hi-IN", 45, "short", "45 से॰"],
  ["hi-IN", 90061, "short", "1 दिन, 1 घं॰, 1 मि॰, 1 से॰"],
  ["hi-IN", 3900, "narrow", "1 घं 5 मि"],
  ["hi-IN", 172803, "narrow", "2 दि 3 से"],
  ["hi-IN", 45, "narrow", "45 से"],
  ["hi-IN", 90061, "narrow", "1 दि, 1 घं, 1 मि 1 से"],
  ["en-US", 3900, "long", "1 hour, 5 minutes"],
  ["en-US", 172803, "long", "2 days, 3 seconds"],
  ["en-US", 45, "long", "45 seconds"],
  ["en-US", 90061, "long", "1 day, 1 hour, 1 minute, 1 second"],
  ["en-US", 3900, "short", "1 hr, 5 min"],
  ["en-US", 172803, "short", "2 days, 3 sec"],
  ["en-US", 45, "short", "45 sec"],
  ["en-US", 90061, "short", "1 day, 1 hr, 1 min, 1 sec"],
  ["en-US", 3900, "narrow", "1h 5m"],
  ["en-US", 172803, "narrow", "2d 3s"],
  ["en-US", 45, "narrow", "45s"],
  ["en-US", 90061, "narrow", "1d 1h 1m 1s"],
  ["ar-EG", 3900, "long", "ساعة و٥ دقائق"],
  ["ar-EG", 172803, "long", "يومان و٣ ثوان"],
  ["ar-EG", 45, "long", "٤٥ ثانية"],
  ["ar-EG", 90061, "long", "يوم، وساعة، ودقيقة، وثانية"],
  ["ar-EG", 3900, "short", "١ س و٥ د"],
  ["ar-EG", 172803, "short", "يومان و٣ ث"],
  ["ar-EG", 45, "short", "٤٥ ث"],
  ["ar-EG", 90061, "short", "يوم، و١ س، و١ د، و١ ث"],
  ["ar-EG", 3900, "narrow", "١ س و٥ د"],
  ["ar-EG", 172803, "narrow", "٢ ي و٣ ث"],
  ["ar-EG", 45, "narrow", "٤٥ ث"],
  ["ar-EG", 90061, "narrow", "١ ي و١ س و١ د و١ ث"],
  ["de-DE", 3900, "long", "1 Stunde, 5 Minuten"],
  ["de-DE", 172803, "long", "2 Tage, 3 Sekunden"],
  ["de-DE", 45, "long", "45 Sekunden"],
  ["de-DE", 90061, "long", "1 Tag, 1 Stunde, 1 Minute und 1 Sekunde"],
  ["de-DE", 3900, "short", "1 Std., 5 Min."],
  ["de-DE", 172803, "short", "2 Tg., 3 Sek."],
  ["de-DE", 45, "short", "45 Sek."],
  ["de-DE", 90061, "short", "1 Tg., 1 Std., 1 Min. und 1 Sek."],
  ["de-DE", 3900, "narrow", "1h, 5 Min."],
  ["de-DE", 172803, "narrow", "2 T, 3 Sek."],
  ["de-DE", 45, "narrow", "45 Sek."],
  ["de-DE", 90061, "narrow", "1 T, 1h, 1 Min. und 1 Sek."],
];

describe("formatDuration", () => {
  const native = (Intl as unknown as { DurationFormat?: unknown }).DurationFormat;
  afterEach(() => {
    (Intl as unknown as { DurationFormat?: unknown }).DurationFormat = native;
  });

  it("writes the shared cases on Intl.DurationFormat", () => {
    expect(native).toBeDefined();
    const wrong = DURATION_CASES.filter(
      ([locale, seconds, style, text]) =>
        formatDuration(seconds * 1000, locale, { style }) !== text,
    );
    expect(wrong).toEqual([]);
  });

  it("writes the same where a browser has no Intl.DurationFormat", () => {
    (Intl as unknown as { DurationFormat?: unknown }).DurationFormat = undefined;
    const wrong = DURATION_CASES.filter(
      ([locale, seconds, style, text]) =>
        formatDuration(seconds * 1000 + 999, locale, { style }) !== text,
    );
    expect(wrong).toEqual([]);
  });

  it("drops a part of a second, writes a negative length as its length, and says 0 seconds", () => {
    expect(formatDuration(3_900_999)).toBe("1 hour, 5 minutes");
    expect(formatDuration(-45_000)).toBe("45 seconds");
    expect(formatDuration(400)).toBe("0 seconds");
    expect(formatDuration(0, "en-IN", { style: "narrow" })).toBe("0s");
  });
});

/**
 * The cases qeetrix-android checks its QeetrixFormat.time against (Tools/FormatCases, Node's
 * Intl.DateTimeFormat timeStyle, ICU 78.2, CLDR 48), so the web and the phones write a time alike:
 * [locale, moment, timeStyle, hourCycle, text], each moment shown in Asia/Kolkata.
 */
const TIME_CASES: [string, string, "short" | "medium", "h12" | "h23" | null, string][] = [
  ["en-IN", "2026-10-25T09:00:00Z", "short", null, "2:30 pm"],
  ["en-IN", "2026-10-25T09:00:00Z", "short", "h23", "14:30"],
  ["en-IN", "2026-10-25T09:00:00Z", "short", "h12", "2:30 pm"],
  ["en-IN", "2026-10-25T09:00:00Z", "medium", null, "2:30:00 pm"],
  ["en-IN", "2026-10-25T09:00:00Z", "medium", "h23", "14:30:00"],
  ["en-IN", "2026-10-25T09:00:00Z", "medium", "h12", "2:30:00 pm"],
  ["en-IN", "2026-10-25T05:17:09Z", "short", null, "10:47 am"],
  ["en-IN", "2026-10-25T05:17:09Z", "short", "h23", "10:47"],
  ["en-IN", "2026-10-25T05:17:09Z", "short", "h12", "10:47 am"],
  ["en-IN", "2026-10-25T05:17:09Z", "medium", null, "10:47:09 am"],
  ["en-IN", "2026-10-25T05:17:09Z", "medium", "h23", "10:47:09"],
  ["en-IN", "2026-10-25T05:17:09Z", "medium", "h12", "10:47:09 am"],
  ["hi-IN", "2026-10-25T09:00:00Z", "short", null, "2:30 pm"],
  ["hi-IN", "2026-10-25T09:00:00Z", "short", "h23", "14:30"],
  ["hi-IN", "2026-10-25T09:00:00Z", "short", "h12", "2:30 pm"],
  ["hi-IN", "2026-10-25T09:00:00Z", "medium", null, "2:30:00 pm"],
  ["hi-IN", "2026-10-25T09:00:00Z", "medium", "h23", "14:30:00"],
  ["hi-IN", "2026-10-25T09:00:00Z", "medium", "h12", "2:30:00 pm"],
  ["hi-IN", "2026-10-25T05:17:09Z", "short", null, "10:47 am"],
  ["hi-IN", "2026-10-25T05:17:09Z", "short", "h23", "10:47"],
  ["hi-IN", "2026-10-25T05:17:09Z", "short", "h12", "10:47 am"],
  ["hi-IN", "2026-10-25T05:17:09Z", "medium", null, "10:47:09 am"],
  ["hi-IN", "2026-10-25T05:17:09Z", "medium", "h23", "10:47:09"],
  ["hi-IN", "2026-10-25T05:17:09Z", "medium", "h12", "10:47:09 am"],
  ["en-US", "2026-10-25T09:00:00Z", "short", null, "2:30 PM"],
  ["en-US", "2026-10-25T09:00:00Z", "short", "h23", "14:30"],
  ["en-US", "2026-10-25T09:00:00Z", "short", "h12", "2:30 PM"],
  ["en-US", "2026-10-25T09:00:00Z", "medium", null, "2:30:00 PM"],
  ["en-US", "2026-10-25T09:00:00Z", "medium", "h23", "14:30:00"],
  ["en-US", "2026-10-25T09:00:00Z", "medium", "h12", "2:30:00 PM"],
  ["en-US", "2026-10-25T05:17:09Z", "short", null, "10:47 AM"],
  ["en-US", "2026-10-25T05:17:09Z", "short", "h23", "10:47"],
  ["en-US", "2026-10-25T05:17:09Z", "short", "h12", "10:47 AM"],
  ["en-US", "2026-10-25T05:17:09Z", "medium", null, "10:47:09 AM"],
  ["en-US", "2026-10-25T05:17:09Z", "medium", "h23", "10:47:09"],
  ["en-US", "2026-10-25T05:17:09Z", "medium", "h12", "10:47:09 AM"],
  ["ar-EG", "2026-10-25T09:00:00Z", "short", null, "٢:٣٠ م"],
  ["ar-EG", "2026-10-25T09:00:00Z", "short", "h23", "١٤:٣٠"],
  ["ar-EG", "2026-10-25T09:00:00Z", "short", "h12", "٢:٣٠ م"],
  ["ar-EG", "2026-10-25T09:00:00Z", "medium", null, "٢:٣٠:٠٠ م"],
  ["ar-EG", "2026-10-25T09:00:00Z", "medium", "h23", "١٤:٣٠:٠٠"],
  ["ar-EG", "2026-10-25T09:00:00Z", "medium", "h12", "٢:٣٠:٠٠ م"],
  ["ar-EG", "2026-10-25T05:17:09Z", "short", null, "١٠:٤٧ ص"],
  ["ar-EG", "2026-10-25T05:17:09Z", "short", "h23", "١٠:٤٧"],
  ["ar-EG", "2026-10-25T05:17:09Z", "short", "h12", "١٠:٤٧ ص"],
  ["ar-EG", "2026-10-25T05:17:09Z", "medium", null, "١٠:٤٧:٠٩ ص"],
  ["ar-EG", "2026-10-25T05:17:09Z", "medium", "h23", "١٠:٤٧:٠٩"],
  ["ar-EG", "2026-10-25T05:17:09Z", "medium", "h12", "١٠:٤٧:٠٩ ص"],
  ["de-DE", "2026-10-25T09:00:00Z", "short", null, "14:30"],
  ["de-DE", "2026-10-25T09:00:00Z", "short", "h23", "14:30"],
  ["de-DE", "2026-10-25T09:00:00Z", "short", "h12", "02:30 PM"],
  ["de-DE", "2026-10-25T09:00:00Z", "medium", null, "14:30:00"],
  ["de-DE", "2026-10-25T09:00:00Z", "medium", "h23", "14:30:00"],
  ["de-DE", "2026-10-25T09:00:00Z", "medium", "h12", "02:30:00 PM"],
  ["de-DE", "2026-10-25T05:17:09Z", "short", null, "10:47"],
  ["de-DE", "2026-10-25T05:17:09Z", "short", "h23", "10:47"],
  ["de-DE", "2026-10-25T05:17:09Z", "short", "h12", "10:47 AM"],
  ["de-DE", "2026-10-25T05:17:09Z", "medium", null, "10:47:09"],
  ["de-DE", "2026-10-25T05:17:09Z", "medium", "h23", "10:47:09"],
  ["de-DE", "2026-10-25T05:17:09Z", "medium", "h12", "10:47:09 AM"],
];

describe("formatTime", () => {
  it("writes the shared cases, on the locale's clock or the hour cycle given", () => {
    const wrong = TIME_CASES.filter(
      ([locale, moment, timeStyle, hourCycle, text]) =>
        formatTime(moment, locale, { timeStyle, ...(hourCycle ? { hourCycle } : {}) }) !== text,
    );
    expect(wrong).toEqual([]);
  });

  it("writes the time formatDateTime writes, in the zone given", () => {
    const moment = "2026-10-25T05:17:09Z";
    expect(formatTime(moment)).toBe("10:47 am");
    expect(formatDateTime(moment)).toBe(`25 Oct 2026, ${formatTime(moment)}`);
    expect(formatTime(moment, "en-IN", { timeZone: "America/New_York" })).toBe("1:17 am");
    expect(formatTime(Date.parse(moment), "en-IN", { timeStyle: "medium" })).toBe("10:47:09 am");
  });

  it("shows a time of day, or a date-time without an offset, as written, in any zone", () => {
    expect(formatTime("14:30")).toBe("2:30 pm");
    expect(formatTime("14:30:45", "en-IN", { timeStyle: "medium", hourCycle: "h23" })).toBe(
      "14:30:45",
    );
    expect(formatTime("2026-10-25T14:30", "en-IN", { timeZone: "America/New_York" })).toBe(
      "2:30 pm",
    );
  });

  it("gives nothing for a date with no time, or for a value that isn't a time", () => {
    expect(formatTime("2026-10-25")).toBe("");
    expect(formatTime("24:00")).toBe("");
    expect(formatTime("10:47 am")).toBe("");
    expect(formatTime(Number.NaN)).toBe("");
  });

  it("is exported from the entry point", () => {
    expect(entry.formatTime).toBe(formatTime);
  });
});
