"use client";

import { type ReactElement, useRef, useState } from "react";
import type { InputProps } from "../../input/input";
import {
  type DateRange,
  formatLocalRange,
  today as localToday,
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

export interface DateRangePickerProps
  extends Omit<
    InputProps,
    "value" | "defaultValue" | "onValueChange" | "type" | "min" | "max" | "name" | "messages"
  > {
  /** The range, or `null` for none; controlled. */
  value?: DateRange | null;
  /** The range when uncontrolled. */
  defaultValue?: DateRange | null;
  /** Called with the new range, or `null` when the field is cleared or what's typed isn't one. */
  onValueChange?: (value: DateRange | null) => void;
  /** The earliest date allowed, "YYYY-MM-DD". */
  min?: string;
  /** The latest date allowed, "YYYY-MM-DD". */
  max?: string;
  /** Rule out more dates as a range's ends, e.g. holidays. */
  isDateDisabled?: (date: string) => boolean;
  /** Today, "YYYY-MM-DD", for tests and screenshots. Default: the browser's today. */
  today?: string;
  /** Default: QeetrixProvider's locale. It sets the date order, the language and the week. */
  locale?: string;
  /** A hidden input with this name submits the start, "YYYY-MM-DD". */
  startName?: string;
  /** A hidden input with this name submits the end, "YYYY-MM-DD". */
  endName?: string;
  /** This picker's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["dateRangePicker"]>;
}

const keyOf = (range: DateRange | null) => (range ? `${range.start}/${range.end}` : "");

/**
 * A field for a range of dates (07-components.md): type both dates ("01/12/2026 – 31/12/2026",
 * any separators, either order) or choose them in a RangeCalendar in a popover as wide as the
 * field: the first day picked starts the range, the second ends it and closes the popover; Escape
 * first undoes a half-chosen range, then closes. Typed text is read like DatePicker's, and a range
 * that can't be read or whose ends aren't allowed keeps its text and makes the field invalid. With
 * `startName` and `endName`, hidden inputs submit "YYYY-MM-DD".
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

  return (
    <PickerField
      {...props}
      input={input}
      typed={typed}
      label={strings.choose}
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
      {(calendar, close) => (
        <RangeCalendar
          ref={calendar}
          value={current}
          min={min}
          max={max}
          isDateDisabled={isDateDisabled}
          today={todayValue}
          locale={locale}
          onValueChange={(range) => {
            typed.settle();
            setValue(range);
            close();
          }}
        />
      )}
    </PickerField>
  );
}
