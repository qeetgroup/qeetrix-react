"use client";

import { type ReactElement, useState } from "react";
import { cx } from "../../internal/cx";
import {
  compareDates,
  type DateParts,
  type DateRange,
  dateFormat,
  parseISODate,
  toISODate,
  toUTC,
} from "../../internal/date";
import { fill } from "../../internal/template";
import { useLocale, useMessages } from "../../provider/provider";
import { VisuallyHidden } from "../../visually-hidden/visually-hidden";
import { CalendarCore, type CalendarProps, type DayMark } from "../calendar/calendar";

export interface RangeCalendarProps
  extends Omit<CalendarProps, "value" | "defaultValue" | "onValueChange"> {
  /** The chosen range, controlled. */
  value?: DateRange | null;
  /** The chosen range when uncontrolled. Default `null`. */
  defaultValue?: DateRange | null;
  /** Called with the range once both ends are chosen. */
  onValueChange?: (value: DateRange) => void;
}

/** Two dates, earlier first. */
const order = (a: DateParts, b: DateParts): [DateParts, DateParts] =>
  compareDates(a, b) <= 0 ? [a, b] : [b, a];

/**
 * A Calendar that chooses a range: the first day picked is one end, and until the second is picked
 * the range follows the pointer or focus, to days that can end it; picking a day before the first
 * swaps them, and the same day twice is a one-day range. Escape undoes a half-chosen range. The
 * range is a band of the subtle brand fill whose ends are filled Ember, every day in it is
 * selected, and each step is announced. Everything else — keys, years and months, limits — is
 * Calendar's.
 */
export function RangeCalendar({
  value,
  defaultValue = null,
  onValueChange,
  className,
  ...props
}: RangeCalendarProps): ReactElement {
  const strings = useMessages("calendar", props.messages);
  const provided = useLocale();
  const full = dateFormat(props.locale ?? provided, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const say = (date: DateParts) => full.format(toUTC(date));

  const [own, setOwn] = useState(defaultValue);
  const range = value === undefined ? own : value;
  const start = parseISODate(range?.start);
  const end = parseISODate(range?.end);
  // The first end picked, while the second is awaited, and the day the range runs to meanwhile.
  const [anchor, setAnchor] = useState<DateParts | null>(null);
  const [point, setPoint] = useState<DateParts | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const ends = anchor ? order(anchor, point ?? anchor) : start && end ? order(start, end) : null;
  const mark = (date: DateParts): DayMark => {
    if (!ends) return undefined;
    const after = compareDates(date, ends[0]);
    const before = compareDates(date, ends[1]);
    if (after < 0 || before > 0) return undefined;
    if (after === 0 && before === 0) return "single";
    return after === 0 ? "start" : before === 0 ? "end" : "middle";
  };

  const pick = (date: DateParts) => {
    if (!anchor) {
      setAnchor(date);
      setPoint(date);
      setAnnouncement(fill(strings.rangeStart, { date: say(date) }));
      return;
    }
    const [from, to] = order(anchor, date);
    const next = { start: toISODate(from), end: toISODate(to) };
    setAnchor(null);
    setAnnouncement(fill(strings.rangeSelected, { start: say(from), end: say(to) }));
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };

  return (
    <CalendarCore
      {...props}
      className={cx("qx-range-calendar", className)}
      rootSlot="range-calendar"
      initial={start}
      chosen={start}
      mark={mark}
      onPick={pick}
      onPoint={anchor ? setPoint : undefined}
      onEscape={() => {
        if (!anchor) return false;
        setAnchor(null);
        setAnnouncement("");
        return true;
      }}
    >
      <VisuallyHidden aria-live="polite">{announcement}</VisuallyHidden>
    </CalendarCore>
  );
}
