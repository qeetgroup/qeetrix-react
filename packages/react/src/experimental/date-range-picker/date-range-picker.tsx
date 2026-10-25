"use client";

import { type ReactElement, useRef, useState } from "react";
import type { InputProps } from "../../input/input";
import {
  clampRange,
  type DateRange,
  type DateRangePresetName,
  formatLocalRange,
  today as localToday,
  namedRange,
  parseISODate,
  parseLocalRange,
  toISODate,
} from "../../internal/date";
import type { QeetrixMessages } from "../../internal/messages";
import { fill } from "../../internal/template";
import { limitProblem, useTypedValue } from "../../internal/typed-value";
import { useLocale, useMessages } from "../../provider/provider";
import { PickerField } from "../date-picker/date-picker";
import { RangeCalendar } from "../range-calendar/range-calendar";

/** A range to choose in one step, beside the calendar. */
export interface DateRangePreset {
  /** What its button says, e.g. "Last quarter". */
  label: string;
  /** The range, or a function that works it out when the list shows, e.g. from today. */
  range: DateRange | (() => DateRange);
}

export interface DateRangePickerProps
  extends Omit<
    InputProps,
    "value" | "defaultValue" | "onValueChange" | "type" | "min" | "max" | "name" | "messages"
  > {
  /** The range, or `null` for none; controlled. */
  value?: DateRange | null;
  /** The range when uncontrolled. Default `null`. */
  defaultValue?: DateRange | null;
  /** Called with the new range, or `null` when the field is cleared or what's typed isn't one. */
  onValueChange?: (value: DateRange | null) => void;
  /** The earliest date allowed, "YYYY-MM-DD". */
  min?: string;
  /** The latest date allowed, "YYYY-MM-DD". */
  max?: string;
  /** Rule out more dates as a range's ends, e.g. holidays. */
  isDateDisabled?: (date: string) => boolean;
  /**
   * Today, "YYYY-MM-DD", for tests and screenshots, and for the named presets; when not set, the
   * browser's today.
   */
  today?: string;
  /** The date order, the language and the week; when not set, QeetrixProvider's locale. */
  locale?: string;
  /** A hidden input with this name submits the start, "YYYY-MM-DD". */
  startName?: string;
  /** A hidden input with this name submits the end, "YYYY-MM-DD". */
  endName?: string;
  /**
   * Ranges to choose in one step, listed beside the calendar: ready-made ones by name, labelled from
   * the catalogue ("today", "last7Days", "last30Days", "last90Days", "thisMonth", "lastMonth"), or
   * your own. Choosing one sets the range and closes the popover. Each is cut to `min` and `max`;
   * one wholly outside them, or that would start or end on a disabled date, can't be chosen.
   */
  presets?: ReadonlyArray<DateRangePreset | DateRangePresetName>;
  /** This picker's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["dateRangePicker"]>;
}

const keyOf = (range: DateRange | null) => (range ? `${range.start}/${range.end}` : "");

/** A named preset's label, from the catalogue. */
const presetLabel = (
  name: DateRangePresetName,
  strings: QeetrixMessages["dateRangePicker"],
): string => {
  switch (name) {
    case "last7Days":
      return fill(strings.lastDays, { count: 7 });
    case "last30Days":
      return fill(strings.lastDays, { count: 30 });
    case "last90Days":
      return fill(strings.lastDays, { count: 90 });
    default:
      return strings[name];
  }
};

/**
 * A field for a range of dates: type both dates ("01/12/2026 – 31/12/2026", any separators, either
 * order) or choose them in a RangeCalendar in a popover as wide as the field: the first day picked
 * starts the range, the second ends it and closes the popover; Escape first undoes a half-chosen
 * range, then closes. `presets` list ranges beside the calendar to choose in one step ("Last 7
 * days"). Typed text is read like DatePicker's, and a range that can't be read or whose ends aren't
 * allowed keeps its text and makes the field invalid. With `startName` and `endName`, hidden inputs
 * submit "YYYY-MM-DD".
 */
export function DateRangePicker({
  value,
  defaultValue = null,
  onValueChange,
  min,
  max,
  isDateDisabled,
  today: todayValue,
  locale: localeProp,
  startName,
  endName,
  presets,
  messages,
  placeholder,
  className,
  ...props
}: DateRangePickerProps): ReactElement {
  const strings = useMessages("dateRangePicker", messages);
  const provided = useLocale();
  const locale = localeProp ?? provided;
  const input = useRef<HTMLInputElement>(null);
  const [own, setOwn] = useState(defaultValue);
  const current = value === undefined ? own : value;
  // December: its 31st shows which number is the day, in any order.
  const [now] = useState(() => parseISODate(todayValue) ?? localToday());
  const example = formatLocalRange(
    {
      start: toISODate({ year: now.year, month: 12, day: 1 }),
      end: toISODate({ year: now.year, month: 12, day: 31 }),
    },
    locale,
  );

  const setValue = (next: DateRange | null) => {
    if (value === undefined) setOwn(next);
    if (keyOf(next) !== keyOf(current)) onValueChange?.(next);
  };

  const limits = { min, max, isDateDisabled };
  const typed = useTypedValue(
    input,
    keyOf(current),
    formatLocalRange(current, locale),
    (text) => {
      const range = parseLocalRange(text, locale);
      return {
        value: range,
        problem:
          range === null
            ? fill(strings.invalid, { range: example })
            : limitProblem(range.start, limits, strings, locale) ||
              limitProblem(range.end, limits, strings, locale),
      };
    },
    setValue,
  );

  // Each preset's range, cut to the limits; `null` when none of it can be chosen.
  const choices = presets?.map((preset) => {
    const { label, range } =
      typeof preset === "string"
        ? { label: presetLabel(preset, strings), range: namedRange(preset, now) }
        : { label: preset.label, range: preset.range };
    const fitted = clampRange(typeof range === "function" ? range() : range, min, max);
    const allowed = fitted && !isDateDisabled?.(fitted.start) && !isDateDisabled?.(fitted.end);
    return { label, range: allowed ? fitted : null };
  });

  return (
    <PickerField
      {...props}
      input={input}
      typed={typed}
      label={strings.choose}
      labelFor={strings.chooseFor}
      wide={choices !== undefined && choices.length > 0}
      placeholder={placeholder ?? fill(strings.example, { range: example })}
      className={className ? `qx-date-range-picker ${className}` : "qx-date-range-picker"}
      hiddenInputs={
        <>
          {startName !== undefined && (
            <input
              type="hidden"
              name={startName}
              value={current?.start ?? ""}
              disabled={props.disabled}
            />
          )}
          {endName !== undefined && (
            <input
              type="hidden"
              name={endName}
              value={current?.end ?? ""}
              disabled={props.disabled}
            />
          )}
        </>
      }
    >
      {(calendar, close) => {
        const choose = (range: DateRange) => {
          typed.settle();
          setValue(range);
          close();
        };
        return (
          <>
            <RangeCalendar
              ref={calendar}
              value={current}
              min={min}
              max={max}
              isDateDisabled={isDateDisabled}
              today={todayValue}
              locale={locale}
              onValueChange={choose}
            />
            {choices && choices.length > 0 && (
              // biome-ignore lint/a11y/useSemanticElements: a fieldset is for form controls; this is a set of buttons
              <div
                role="group"
                aria-label={strings.presets}
                className="qx-date-range-picker-presets"
                data-slot="date-range-picker-presets"
              >
                {choices.map(({ label, range }) => (
                  <button
                    key={label}
                    type="button"
                    aria-disabled={range ? undefined : true}
                    className="qx-date-range-picker-preset"
                    data-slot="date-range-picker-preset"
                    onClick={() => {
                      if (range) choose(range);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </>
        );
      }}
    </PickerField>
  );
}
