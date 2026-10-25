/**
 * Locale packs are complete, and live outside the main bundle; the format helpers give Indian
 * grouping by default and agree between server and client.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { formatCurrency, formatNumber, formatRelativeTime } from "../src/format/format";
import { messages } from "../src/internal/messages";
import { hi } from "../src/locales/hi";

const keys = (catalogue: object) =>
  Object.entries(catalogue).flatMap(([group, strings]) =>
    Object.keys(strings as object).map((key) => `${group}.${key}`),
  );

describe("locale packs", () => {
  it("Hindi translates every string, and nothing else", () => {
    expect(keys(hi).sort()).toEqual(keys(messages).sort());
    for (const [group, strings] of Object.entries(hi)) {
      for (const [key, value] of Object.entries(strings as Record<string, string>)) {
        const english = (messages as Record<string, Record<string, string>>)[group]?.[key];
        expect(value, `${group}.${key}`).not.toBe(english);
        expect(value.trim(), `${group}.${key}`).not.toBe("");
      }
    }
  });

  it("are separate entry points that the main bundle never imports", () => {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    expect(pkg.exports["./locales/hi"]).toEqual({
      types: "./dist/locales/hi.d.ts",
      default: "./dist/locales/hi.js",
    });
    const index = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");
    expect(index).not.toMatch(/from "\.\/locales/);
  });
});

describe("format helpers", () => {
  it("group numbers the Indian way by default", () => {
    expect(formatNumber(1234567)).toBe("12,34,567");
    expect(formatNumber(1234567, "en-US")).toBe("1,234,567");
  });

  it("format money with the currency's symbol and decimals", () => {
    expect(formatCurrency(124500, "INR")).toBe("₹1,24,500.00");
    expect(formatCurrency(124500, "INR", "en-IN", { maximumFractionDigits: 0 })).toBe("₹1,24,500");
  });

  it("say how long ago in the largest whole unit, against a given now", () => {
    const now = Date.UTC(2026, 9, 25, 12, 0, 0);
    expect(formatRelativeTime(now - 2 * 60_000, "en-IN", now)).toBe("2 minutes ago");
    expect(formatRelativeTime(now - 24 * 60 * 60_000, "en-IN", now)).toBe("yesterday");
    expect(formatRelativeTime(now + 3 * 24 * 60 * 60_000, "en-IN", now)).toBe("in 3 days");
    expect(formatRelativeTime(now - 2 * 60_000, "hi-IN", now)).toBe("2 मिनट पहले");
  });
});
