import { DEFAULT_LOCALE } from "../internal/messages";

/**
 * Locale-aware formatting on Intl (decision D-13). Pure and server-safe: on the client, pass
 * `useLocale()`. Formatters are cached per locale and options, since constructing one is the slow
 * part.
 */
const cache = new Map<string, Intl.NumberFormat | Intl.RelativeTimeFormat>();

function cached<T extends Intl.NumberFormat | Intl.RelativeTimeFormat>(
  key: string,
  create: () => T,
): T {
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

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60 * 1000],
  ["month", 30 * 24 * 60 * 60 * 1000],
  ["week", 7 * 24 * 60 * 60 * 1000],
  ["day", 24 * 60 * 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
  ["second", 1000],
];

/**
 * How long ago or how soon, in the largest whole unit: "2 minutes ago", "in 3 days", "yesterday".
 * `now` is a parameter so server and client render the same text.
 */
export function formatRelativeTime(
  date: Date | number,
  locale: string = DEFAULT_LOCALE,
  now: Date | number = Date.now(),
): string {
  const delta = Number(date) - Number(now);
  const [unit, size] = UNITS.find(([, ms]) => Math.abs(delta) >= ms) ?? ["second", 1000];
  const formatter = cached(
    `r|${locale}`,
    () => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }),
  );
  return formatter.format(Math.round(delta / size), unit);
}
