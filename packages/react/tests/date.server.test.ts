/**
 * The internal calendar-date helpers behind Calendar and the date pickers: ISO strings in and out,
 * arithmetic on UTC midnights, and the week's first day by locale.
 */
import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  compareDates,
  dateOrder,
  daysInMonth,
  firstDayOfWeek,
  formatLocalDate,
  formatLocalRange,
  parseISODate,
  parseLocalDate,
  parseLocalRange,
  toISODate,
  weekday,
} from "../src/internal/date";

const d = (iso: string) => parseISODate(iso) as NonNullable<ReturnType<typeof parseISODate>>;

describe("calendar dates", () => {
  it("read and write ISO dates, and refuse impossible ones", () => {
    expect(parseISODate("2026-10-25")).toEqual({ year: 2026, month: 10, day: 25 });
    expect(parseISODate("2026-02-31")).toBeNull();
    expect(parseISODate("25/10/2026")).toBeNull();
    expect(parseISODate("")).toBeNull();
    expect(toISODate({ year: 987, month: 3, day: 4 })).toBe("0987-03-04");
  });

  it("add days across months and years", () => {
    expect(toISODate(addDays(d("2026-10-31"), 1))).toBe("2026-11-01");
    expect(toISODate(addDays(d("2027-01-01"), -1))).toBe("2026-12-31");
    expect(toISODate(addDays(d("2026-10-25"), 7))).toBe("2026-11-01");
  });

  it("add months, landing on the last day when the month is shorter", () => {
    expect(toISODate(addMonths(d("2026-01-31"), 1))).toBe("2026-02-28");
    expect(toISODate(addMonths(d("2028-01-31"), 1))).toBe("2028-02-29");
    expect(toISODate(addMonths(d("2026-03-15"), -12))).toBe("2025-03-15");
    expect(toISODate(addMonths(d("2026-12-10"), 1))).toBe("2027-01-10");
    expect(daysInMonth(2028, 2)).toBe(29);
  });

  it("compare dates and know the weekday", () => {
    expect(compareDates(d("2026-10-25"), d("2026-10-26"))).toBeLessThan(0);
    expect(compareDates(d("2026-10-25"), d("2026-10-25"))).toBe(0);
    expect(weekday(d("2026-10-25"))).toBe(0);
  });

  it("start the week on Sunday in India and the US, Monday in the UK and Germany", () => {
    expect(firstDayOfWeek("en-IN")).toBe(0);
    expect(firstDayOfWeek("hi-IN")).toBe(0);
    expect(firstDayOfWeek("en-US")).toBe(0);
    expect(firstDayOfWeek("en-GB")).toBe(1);
    expect(firstDayOfWeek("de-DE")).toBe(1);
  });

  it("know each locale's order, and write dates in its numbers", () => {
    expect(dateOrder("en-IN")).toEqual(["day", "month", "year"]);
    expect(dateOrder("en-US")).toEqual(["month", "day", "year"]);
    expect(formatLocalDate("2026-10-25", "en-IN")).toBe("25/10/2026");
    expect(formatLocalDate("2026-10-25", "en-US")).toBe("10/25/2026");
    expect(formatLocalDate("not a date", "en-IN")).toBe("");
  });

  it("read typed dates in the locale's order, with any separator, and refuse the rest", () => {
    expect(parseLocalDate("25/10/2026", "en-IN")).toBe("2026-10-25");
    expect(parseLocalDate(" 5-3-2026 ", "en-IN")).toBe("2026-03-05");
    expect(parseLocalDate("25.10.26", "en-IN")).toBe("2026-10-25");
    expect(parseLocalDate("10/25/2026", "en-US")).toBe("2026-10-25");
    expect(parseLocalDate("2026-10-25", "en-US")).toBe("2026-10-25");
    expect(parseLocalDate("31/02/2026", "en-IN")).toBeNull();
    expect(parseLocalDate("25/10", "en-IN")).toBeNull();
    expect(parseLocalDate("tomorrow", "en-IN")).toBeNull();
    expect(parseLocalDate("25/10/202", "en-IN")).toBeNull();
    expect(parseLocalDate("125/10/2026", "en-IN")).toBeNull();
  });

  it("stay Gregorian with Latin digits, so every locale's dates can be typed back", () => {
    expect(formatLocalDate("2026-10-25", "th-TH")).toBe("25/10/2026");
    expect(formatLocalDate("2026-10-25", "fa")).toBe("2026/10/25");
    const arabic = formatLocalDate("2026-10-25", "ar-EG");
    expect(arabic).toMatch(/^25\D+10\D+2026$/);
    expect(parseLocalDate(arabic, "ar-EG")).toBe("2026-10-25");
  });

  it("read and write ranges: six numbers in the locale's order or ISO, ends put in order", () => {
    const december = { start: "2026-12-01", end: "2026-12-31" };
    expect(formatLocalRange(december, "en-IN")).toBe("01/12/2026 – 31/12/2026");
    expect(formatLocalRange(null, "en-IN")).toBe("");
    expect(parseLocalRange("01/12/2026 – 31/12/2026", "en-IN")).toEqual(december);
    expect(parseLocalRange("1-12-26 - 31-12-26", "en-IN")).toEqual(december);
    expect(parseLocalRange("31.12.2026 01.12.2026", "en-IN")).toEqual(december);
    expect(parseLocalRange("2026-12-01 – 2026-12-31", "en-US")).toEqual(december);
    expect(parseLocalRange("12/01/2026 - 12/31/2026", "en-US")).toEqual(december);
    expect(parseLocalRange("01/12/2026", "en-IN")).toBeNull();
    expect(parseLocalRange("01/12/2026 – 31/02/2026", "en-IN")).toBeNull();
    expect(parseLocalRange("1 Dec 2026 to 31 Dec 2026", "en-IN")).toBeNull();
  });
});
