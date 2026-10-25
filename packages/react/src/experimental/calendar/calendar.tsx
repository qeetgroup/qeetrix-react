"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { ChevronDownIcon } from "@qeetrix/icons/icons/chevron-down";
import { ChevronLeftIcon } from "@qeetrix/icons/icons/chevron-left";
import { ChevronRightIcon } from "@qeetrix/icons/icons/chevron-right";
import {
  type ComponentProps,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { IconButton } from "../../button/button";
import { cx } from "../../internal/cx";
import {
  addDays,
  addMonths,
  type CalendarView,
  clampDate,
  compareDates,
  type DateParts,
  dateFormat,
  dayIn,
  daysInMonth,
  firstDayOfWeek,
  isOutside,
  keyTarget,
  today as localToday,
  parseISODate,
  toISODate,
  toUTC,
  weekday,
} from "../../internal/date";
import type { QeetrixMessages } from "../../internal/messages";
import { mergeRefs } from "../../internal/refs";
import { fill } from "../../internal/template";
import { useLocale, useMessages } from "../../provider/provider";

export interface CalendarProps
  extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The chosen date, "YYYY-MM-DD", controlled. */
  value?: string | null;
  /** The chosen date when uncontrolled. Default `null`. */
  defaultValue?: string | null;
  /** Called with the chosen date, "YYYY-MM-DD". */
  onValueChange?: (value: string) => void;
  /** The earliest date that can be chosen, "YYYY-MM-DD". */
  min?: string | undefined;
  /** The latest date that can be chosen, "YYYY-MM-DD". */
  max?: string | undefined;
  /** Rule out more dates, e.g. weekends or holidays. */
  isDateDisabled?: ((date: string) => boolean) | undefined;
  /** The month shown first when nothing is chosen, "YYYY-MM"; when not set, today's month. */
  defaultMonth?: string;
  /** Today, "YYYY-MM-DD", for tests and screenshots; when not set, the browser's today. */
  today?: string | undefined;
  /**
   * The language and the first day of the week (Sunday for India); when not set,
   * QeetrixProvider's locale.
   */
  locale?: string | undefined;
  /** Put focus on the focusable day when it mounts, e.g. when a picker opens. Default `false`. */
  autoFocus?: boolean;
  /**
   * Nothing can be chosen and the month stays put: the days, the arrows and the title are dimmed
   * and do nothing. They stay focusable, so the date can still be read. Default `false`.
   */
  disabled?: boolean | undefined;
  /** The date shows and the months can be browsed, but no day can be chosen. Default `false`. */
  readOnly?: boolean | undefined;
  /** This calendar's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["calendar"]>;
}

// The first year of a date's decade: the year view shows it, with a year either side.
const decadeOf = (year: number) => Math.floor(year / 10) * 10;

// The four rows of a 3-column panel of 12: the months, or a decade with the year either side.
const PANEL_ROWS = [0, 1, 2, 3];

/** What a day is in the selection: the one chosen day, or a range's start, end or middle. */
export type DayMark = "single" | "start" | "end" | "middle" | undefined;

/** The grid and views Calendar and RangeCalendar share. Not part of the package's API. */
export interface CalendarCoreProps
  extends Omit<CalendarProps, "value" | "defaultValue" | "onValueChange"> {
  /** Where focus starts, before `defaultMonth` and today: the chosen date, or a range's start. */
  initial: DateParts | null;
  /** The date the month and year panels show as chosen. */
  chosen: DateParts | null;
  /** What each day is in the selection. */
  mark: (date: DateParts) => DayMark;
  /** A day was clicked or entered; disabled days never are. */
  onPick: (date: DateParts) => void;
  /** The day under the pointer or focus, `null` when the pointer leaves: a range previews to it. */
  onPoint?: ((date: DateParts | null) => void) | undefined;
  /** Escape in the days: return `true` when it was used (a half-chosen range undone). */
  onEscape?: (() => boolean) | undefined;
  /** After the grid, e.g. a live region. */
  children?: ReactNode;
  /** The root's `data-slot`. */
  rootSlot?: string;
}

// The month grid, the year and month views, and their keys. Selection belongs to the caller.
// Line comments in this module: the build keeps block comments, and the family has a size budget.
export function CalendarCore({
  initial,
  chosen,
  mark,
  onPick,
  onPoint,
  onEscape,
  children,
  rootSlot = "calendar",
  disabled = false,
  readOnly = false,
  min: minValue,
  max: maxValue,
  isDateDisabled,
  defaultMonth,
  today: todayValue,
  locale: localeProp,
  autoFocus = false,
  messages,
  className,
  ref,
  onKeyDown: onRootKeyDown,
  ...props
}: CalendarCoreProps): ReactElement {
  const strings = useMessages("calendar", messages);
  const provided = useLocale();
  const locale = localeProp ?? provided;
  const rtl = useDirection() === "rtl";
  const titleId = useId();
  const root = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(autoFocus);

  const min = parseISODate(minValue);
  const max = parseISODate(maxValue);
  const [now] = useState(() => parseISODate(todayValue) ?? localToday());
  const [view, setView] = useState<CalendarView>("day");
  const [focused, setFocused] = useState<DateParts>(() => {
    const month = defaultMonth ? parseISODate(`${defaultMonth}-01`) : null;
    return clampDate(initial ?? month ?? now, min, max);
  });

  const isDisabled = (date: DateParts) =>
    isOutside(date, date, min, max) || (isDateDisabled?.(toISODate(date)) ?? false);
  const monthOutside = (year: number, month: number) =>
    isOutside({ year, month, day: 1 }, dayIn(year, month, 31), min, max);
  const yearOutside = (year: number) =>
    isOutside({ year, month: 1, day: 1 }, { year, month: 12, day: 31 }, min, max);

  // Disabled or read-only, nothing is chosen or previewed; disabled, the month and view stay put.
  const locked = disabled || readOnly;
  const choose = (date: DateParts) => {
    if (!locked && !isDisabled(date)) onPick(date);
  };
  // A range previews only to a day that can end it.
  const point = (date: DateParts) => {
    if (!locked && !isDisabled(date)) onPoint?.(date);
  };

  const go = (date: DateParts, focus: boolean) => {
    moveFocus.current = focus;
    setFocused(clampDate(date, min, max));
  };

  // Show another view, with focus on its item for the focused date.
  const show = (next: CalendarView, date: DateParts = focused) => {
    moveFocus.current = true;
    setFocused(clampDate(date, min, max));
    setView(next);
  };

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    const item =
      view === "day"
        ? `[data-date="${toISODate(focused)}"]`
        : view === "month"
          ? `[data-month="${toISODate(focused).slice(0, 7)}"]`
          : `[data-year="${focused.year}"]`;
    root.current?.querySelector<HTMLElement>(item)?.focus();
  }, [focused, view]);

  // The month on show: weeks from the locale's first weekday, six rows so the height never jumps.
  const first = firstDayOfWeek(locale);
  const start = { year: focused.year, month: focused.month, day: 1 };
  const lead = (weekday(start) - first + 7) % 7;
  const length = daysInMonth(focused.year, focused.month);
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - lead + 1;
    return day >= 1 && day <= length ? { year: focused.year, month: focused.month, day } : null;
  });
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    toUTC(addDays({ year: 2023, month: 1, day: 1 }, first + index)),
  );
  const decade = decadeOf(focused.year);

  const onGridKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const next = disabled ? null : keyTarget(view, event.key, event.shiftKey, focused, first, rtl);
    if (!next) return;
    event.preventDefault();
    go(next, true);
  };

  // Escape steps back to the days, or undoes a half-chosen range, and goes no further: in a
  // picker, the next Escape closes it.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && (view !== "day" || onEscape?.())) {
      event.preventDefault();
      event.stopPropagation();
      if (view !== "day") show("day");
    }
    onRootKeyDown?.(event);
  };

  const monthName = dateFormat(locale, { month: "long", year: "numeric" }).format(toUTC(start));
  const yearName = dateFormat(locale, { year: "numeric" });
  const fullDate = dateFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // The arrows move a month, a year or a decade, and stop at the range's ends.
  const months = view === "day" ? 1 : view === "month" ? 12 : 120;
  const previousOut =
    min !== null &&
    (view === "day"
      ? compareDates(addMonths(start, -1), { ...min, day: 1 }) < 0
      : (view === "month" ? focused.year : decade) - 1 < min.year);
  const nextOut =
    max !== null &&
    (view === "day"
      ? compareDates(addMonths(start, 1), { ...max, day: 1 }) > 0
      : (view === "month" ? focused.year + 1 : decade + 10) > max.year);
  const labels = {
    day: [strings.previousMonth, strings.nextMonth],
    month: [strings.previousYear, strings.nextYear],
    year: [strings.previousYears, strings.nextYears],
  }[view];

  const title =
    view === "day"
      ? monthName
      : view === "month"
        ? yearName.format(toUTC(start))
        : yearName.formatRange(
            toUTC({ year: decade, month: 1, day: 1 }),
            toUTC({ year: decade + 9, month: 1, day: 1 }),
          );
  // The months of the focused year, or its decade with the year either side (those two muted).
  const panel = Array.from({ length: 12 }, (_, index) => {
    if (view === "month") {
      const month = index + 1;
      const date = dayIn(focused.year, month, focused.day);
      return {
        key: toISODate(date).slice(0, 7),
        date,
        text: dateFormat(locale, { month: "short" }).format(toUTC({ ...date, day: 1 })),
        focus: month === focused.month,
        selected: chosen?.year === focused.year && chosen.month === month,
        current: now.year === focused.year && now.month === month,
        disabled: monthOutside(focused.year, month),
        outside: false,
      };
    }
    const year = decade - 1 + index;
    return {
      key: String(year),
      date: dayIn(year, focused.month, focused.day),
      text: yearName.format(toUTC({ year, month: 1, day: 1 })),
      focus: year === focused.year,
      selected: chosen?.year === year,
      current: now.year === year,
      disabled: yearOutside(year),
      outside: index === 0 || index === 11,
    };
  });

  const heading = (
    <span id={titleId} aria-live="polite" data-slot="calendar-title">
      {title}
    </span>
  );

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Escape from any of the calendar's buttons (title, arrows, grid) steps back to the days
    <div
      {...props}
      ref={mergeRefs(ref, root)}
      className={cx("qx-calendar", className)}
      data-slot={rootSlot}
      data-view={view}
      data-disabled={disabled ? "" : undefined}
      data-readonly={readOnly ? "" : undefined}
      onKeyDown={onKeyDown}
    >
      <div className="qx-calendar-header" data-slot="calendar-header">
        <IconButton
          icon={ChevronLeftIcon}
          aria-label={labels[0] ?? ""}
          tone="neutral"
          size="sm"
          tooltip={false}
          disabled={disabled || previousOut}
          onClick={() => go(addMonths(focused, -months), false)}
          className="qx-calendar-step"
          render={<button type="button" data-slot="calendar-previous" />}
        />
        <div className="qx-calendar-title">
          {view === "year" ? (
            heading
          ) : (
            <button
              type="button"
              className="qx-calendar-zoom"
              aria-label={fill(strings.chooseYear, { title })}
              aria-disabled={disabled || undefined}
              onClick={() => {
                if (!disabled) show("year");
              }}
              data-slot="calendar-zoom"
            >
              {heading}
              <ChevronDownIcon
                shape="sharp"
                size={16}
                aria-hidden
                className="qx-calendar-zoom-icon"
              />
            </button>
          )}
        </div>
        <IconButton
          icon={ChevronRightIcon}
          aria-label={labels[1] ?? ""}
          tone="neutral"
          size="sm"
          tooltip={false}
          disabled={disabled || nextOut}
          onClick={() => go(addMonths(focused, months), false)}
          className="qx-calendar-step"
          render={<button type="button" data-slot="calendar-next" />}
        />
      </div>
      <div className="qx-calendar-body" data-slot="calendar-body">
        <table
          // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: the WAI-ARIA date picker pattern is a table with role="grid"
          role="grid"
          aria-labelledby={titleId}
          aria-disabled={disabled || undefined}
          aria-readonly={readOnly || undefined}
          className="qx-calendar-grid"
          data-slot="calendar-grid"
          // Under the months or years, the days stay in place, unseen, to keep the size.
          data-covered={view === "day" ? undefined : ""}
          onKeyDown={onGridKeyDown}
          onMouseLeave={() => onPoint?.(null)}
        >
          <thead>
            <tr>
              {weekdays.map((day) => (
                <th
                  key={day.toISOString()}
                  scope="col"
                  abbr={dateFormat(locale, { weekday: "long" }).format(day)}
                  className="qx-calendar-weekday"
                  data-slot="calendar-weekday"
                >
                  {dateFormat(locale, { weekday: "short" }).format(day)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }, (_, week) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: the six weeks are positions in the month
              <tr key={week}>
                {cells.slice(week * 7, week * 7 + 7).map((date, index) => {
                  if (!date) {
                    return (
                      // biome-ignore lint/suspicious/noArrayIndexKey: blank cells are positions in the week
                      <td key={index} className="qx-calendar-cell" data-slot="calendar-cell" />
                    );
                  }
                  const iso = toISODate(date);
                  const isToday = compareDates(date, now) === 0;
                  const part = mark(date);
                  const label = fullDate.format(toUTC(date));
                  return (
                    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: a td in a role="grid" table is a gridcell, which takes aria-selected (WAI-ARIA date picker)
                    <td
                      key={iso}
                      className="qx-calendar-cell"
                      data-slot="calendar-cell"
                      aria-selected={part ? true : undefined}
                      data-range={part === "single" ? undefined : part}
                    >
                      <button
                        type="button"
                        tabIndex={compareDates(date, focused) === 0 ? 0 : -1}
                        aria-label={isToday ? fill(strings.today, { date: label }) : label}
                        aria-disabled={disabled || isDisabled(date) || undefined}
                        data-date={iso}
                        data-today={isToday ? "" : undefined}
                        className="qx-calendar-day"
                        data-slot="calendar-day"
                        // Roving focus follows wherever focus lands: a click, a script, a screen reader.
                        onFocus={() => {
                          if (compareDates(date, focused) !== 0) setFocused(date);
                          point(date);
                        }}
                        onMouseEnter={() => point(date)}
                        onClick={() => {
                          go(date, false);
                          choose(date);
                        }}
                      >
                        {date.day}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {view !== "day" && (
          <table
            // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: the months and years are a grid like the days
            role="grid"
            aria-labelledby={titleId}
            className="qx-calendar-grid qx-calendar-panel"
            data-slot="calendar-panel"
            onKeyDown={onGridKeyDown}
          >
            <tbody>
              {PANEL_ROWS.map((row) => (
                <tr key={row}>
                  {panel.slice(row * 3, row * 3 + 3).map((item) => (
                    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: a td in a role="grid" table is a gridcell, which takes aria-selected
                    <td
                      key={item.key}
                      className="qx-calendar-cell"
                      data-slot="calendar-cell"
                      aria-selected={item.selected || undefined}
                    >
                      <button
                        type="button"
                        tabIndex={item.focus ? 0 : -1}
                        aria-disabled={item.disabled || undefined}
                        aria-current={item.current ? "date" : undefined}
                        data-month={view === "month" ? item.key : undefined}
                        data-year={view === "year" ? item.key : undefined}
                        data-today={item.current ? "" : undefined}
                        data-outside={item.outside ? "" : undefined}
                        className="qx-calendar-option"
                        data-slot="calendar-option"
                        onFocus={() => {
                          if (!item.focus) setFocused(item.date);
                        }}
                        onClick={() => {
                          if (!item.disabled) show(view === "month" ? "day" : "month", item.date);
                        }}
                      >
                        {item.text}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {children}
    </div>
  );
}

/**
 * A month of dates to choose from, on the WAI-ARIA date picker's grid. One day is in
 * the Tab order at a time; arrow keys move by day and week (mirrored right-to-left), Home and End
 * to the week's ends, Page Up and Page Down by month (with Shift, by year), Enter or Space choose.
 * Each day is read as its full date. The title opens the years, a decade a page; choosing a year
 * shows its months, and choosing a month its days. Escape goes back to the days. Dates are
 * "YYYY-MM-DD" strings, Gregorian, without a time.
 */
export function Calendar({
  value,
  defaultValue = null,
  onValueChange,
  ...props
}: CalendarProps): ReactElement {
  const [own, setOwn] = useState(defaultValue);
  const selected = parseISODate(value === undefined ? own : value);
  return (
    <CalendarCore
      {...props}
      initial={selected}
      chosen={selected}
      mark={(date) => (selected && compareDates(date, selected) === 0 ? "single" : undefined)}
      onPick={(date) => {
        const iso = toISODate(date);
        if (value === undefined) setOwn(iso);
        onValueChange?.(iso);
      }}
    />
  );
}
