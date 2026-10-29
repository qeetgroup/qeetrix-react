"use client";

import { type ComponentProps, type ReactElement, useEffect, useState } from "react";
import { formatRelativeTime } from "../../format/format";
import { cx } from "../../internal/cx";
import { useLocale } from "../../provider/provider";

export interface RelativeTimeProps extends Omit<ComponentProps<"time">, "dateTime" | "children"> {
  /** The moment: a Date, a timestamp in milliseconds, or an ISO 8601 string. */
  date: Date | number | string;
  /** Beyond this distance, in milliseconds, show the date instead. Default 30 days. */
  threshold?: number;
  /** A fixed "now", for tests and screenshots; it also stops the live updates. */
  now?: Date | number;
  /** Keep the text current while it's on screen. Default `true`. */
  live?: boolean;
  /** Default: QeetrixProvider's locale. */
  locale?: string;
}

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const formats = new Map<string, Intl.DateTimeFormat>();
function dateFormat(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = formats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, options);
    formats.set(key, format);
  }
  return format;
}

/** How often to refresh, by age: every 15 s within a minute, every minute within an hour, then 30. */
const cadence = (age: number) => (age < MINUTE ? 15_000 : age < 60 * MINUTE ? MINUTE : 30 * MINUTE);

/**
 * When something happened, as people say it (07-components.md, C3): "2 minutes ago", "yesterday",
 * then a date past the threshold. It's a `<time>` with the exact moment in `datetime`, and the full
 * date and time as its title. It updates while it's on screen.
 */
export function RelativeTime({
  date,
  threshold = 30 * DAY,
  now: fixedNow,
  live = true,
  locale: localeProp,
  className,
  ...props
}: RelativeTimeProps): ReactElement {
  const provided = useLocale();
  const locale = localeProp ?? provided;
  const moment = new Date(date);
  const [clock, setClock] = useState(() => Number(fixedNow ?? Date.now()));
  const now = fixedNow === undefined ? clock : Number(fixedNow);
  const age = Math.abs(now - moment.getTime());

  const every = cadence(age);
  useEffect(() => {
    if (fixedNow !== undefined || !live) return;
    const id = window.setInterval(() => setClock(Date.now()), every);
    return () => window.clearInterval(id);
  }, [fixedNow, live, every]);

  const text =
    age > threshold
      ? dateFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(moment)
      : formatRelativeTime(moment, locale, now);
  return (
    <time
      {...props}
      dateTime={moment.toISOString()}
      title={dateFormat(locale, { dateStyle: "long", timeStyle: "short" }).format(moment)}
      className={cx("qx-relative-time", className)}
      data-slot="relative-time"
      // The server's clock and the browser's differ; the browser's text wins after hydration.
      suppressHydrationWarning
    >
      {text}
    </time>
  );
}
