/**
 * The format helpers on the server: relative time rounds before it picks a unit, and dates and
 * date-times read every input the same way in any runtime time zone, always Gregorian.
 */
import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatRelativeTime } from "../src/format/format";
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
