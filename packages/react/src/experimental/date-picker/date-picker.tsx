"use client";

import { CalendarIcon } from "@qeetrix/icons/icons/calendar";
import { type ReactElement, type ReactNode, type RefObject, useRef, useState } from "react";
import { IconButton } from "../../button/button";
import { Input, type InputProps } from "../../input/input";
import {
  formatLocalDate,
  today as localToday,
  parseISODate,
  parseLocalDate,
  toISODate,
} from "../../internal/date";
import { useLabelText } from "../../internal/label-text";
import type { QeetrixMessages } from "../../internal/messages";
import { mergeRefs } from "../../internal/refs";
import { fill } from "../../internal/template";
import { limitProblem, type TypedValue, useTypedValue } from "../../internal/typed-value";
import { Popover, PopoverContent, PopoverTrigger } from "../../popover/popover";
import { useLocale, useMessages } from "../../provider/provider";
import { Calendar } from "../calendar/calendar";

export interface DatePickerProps
  extends Omit<
    InputProps,
    "value" | "defaultValue" | "onValueChange" | "type" | "min" | "max" | "messages"
  > {
  /** The date, "YYYY-MM-DD", or `null` for none; controlled. */
  value?: string | null;
  /** The date when uncontrolled. Default `null`. */
  defaultValue?: string | null;
  /** Called with the new date, or `null` when the field is cleared or what's typed isn't a date. */
  onValueChange?: (value: string | null) => void;
  /** The earliest date allowed, "YYYY-MM-DD". */
  min?: string;
  /** The latest date allowed, "YYYY-MM-DD". */
  max?: string;
  /** Rule out more dates, e.g. weekends or holidays. */
  isDateDisabled?: (date: string) => boolean;
  /** Today, "YYYY-MM-DD", for tests and screenshots; when not set, the browser's today. */
  today?: string;
  /** The date order, the language and the week; when not set, QeetrixProvider's locale. */
  locale?: string;
  /** This picker's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["datePicker"]>;
}

/** The field and popover both date pickers share. Not part of the package's API. */
export interface PickerFieldProps
  extends Omit<InputProps, "value" | "defaultValue" | "onValueChange" | "type" | "children"> {
  /** The `<input>`, for its validity. */
  input: RefObject<HTMLInputElement | null>;
  typed: TypedValue;
  /** The calendar button's tooltip, and its name while the field has no label: "Choose date". */
  label: string;
  /** The button's and the dialog's name, with the field's label: "Choose date for {label}". */
  labelFor: string;
  /** Hidden inputs that submit the value. */
  hiddenInputs?: ReactNode;
  /** Something beside the calendar, such as presets: the popup may grow wider than the field. */
  wide?: boolean;
  /** The calendar, given a ref for its root and a way to close the popover. */
  children: (calendar: RefObject<HTMLDivElement | null>, close: () => void) => ReactNode;
}

/**
 * The Input box with a calendar button at its end, and a calendar in a popover exactly as wide as
 * the field. The button, or Alt+Down in the field, opens it with focus on the calendar's day;
 * choosing, Escape or Tab closes it, and focus returns to where it was opened from. The button and
 * the dialog are named after the field's label, so two pickers on a form can be told apart.
 */
export function PickerField({
  input,
  typed,
  label,
  labelFor,
  hiddenInputs,
  wide = false,
  children,
  disabled,
  readOnly,
  endAdornment,
  ref,
  onBlur,
  onKeyDown,
  className,
  ...props
}: PickerFieldProps): ReactElement {
  const calendar = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  // Opened from the field with Alt+Down, focus goes back to the field; from the button, the button.
  const returnTo = useRef<HTMLElement | null>(null);
  const locked = disabled || readOnly;
  // The field's label, read from the page once it's there; before that, its own aria-label.
  const field = useLabelText(input) || props["aria-label"];
  const name = field ? fill(labelFor, { label: field }) : label;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) returnTo.current = null;
        setOpen(next);
      }}
    >
      <Input
        {...props}
        ref={mergeRefs(ref, input)}
        value={typed.text}
        autoComplete={props.autoComplete ?? "off"}
        disabled={disabled}
        readOnly={readOnly}
        className={className ? `qx-date-picker ${className}` : "qx-date-picker"}
        onValueChange={typed.edit}
        onBlur={(event) => {
          typed.read();
          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") typed.read();
          if (event.key === "ArrowDown" && event.altKey && !locked) {
            event.preventDefault();
            returnTo.current = input.current;
            setOpen(true);
          }
          onKeyDown?.(event);
        }}
        endAdornment={
          <>
            {endAdornment}
            <PopoverTrigger
              disabled={locked}
              render={
                <IconButton
                  icon={CalendarIcon}
                  aria-label={name}
                  tooltip={label}
                  size="sm"
                  tone="neutral"
                  disabled={locked}
                  className="qx-date-picker-trigger"
                />
              }
            />
          </>
        }
      />
      {hiddenInputs}
      <PopoverContent
        anchor={() => input.current?.parentElement ?? null}
        align="start"
        sideOffset={4}
        aria-label={name}
        initialFocus={() =>
          calendar.current?.querySelector<HTMLElement>('[data-date][tabindex="0"]') ?? true
        }
        finalFocus={() => returnTo.current ?? true}
        className="qx-date-picker-popup"
        data-wide={wide ? "" : undefined}
      >
        <div className="qx-date-picker-panel" data-slot="date-picker-panel">
          {children(calendar, () => setOpen(false))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * A date field: type the date in the locale's order (25/10/2026 for India) or choose it from a
 * Calendar in a popover (the WAI-ARIA date picker dialog). Typed text is read when the field loses
 * focus or on Enter; a date that can't be read or isn't allowed keeps its text and makes the field
 * invalid through the browser's own validity, so Field shows why and Form stops the submit. The
 * calendar button, named after the field ("Choose date for Joining date"), or Alt+Down in the
 * field, opens the calendar on the field's date; choosing a date, Escape or Tab closes it, and focus
 * returns to where it was opened from. With `name`, a hidden input submits "YYYY-MM-DD"; Base UI
 * Form's `onFormSubmit` values read the field's text instead.
 */
export function DatePicker({
  value,
  defaultValue = null,
  onValueChange,
  min,
  max,
  isDateDisabled,
  today: todayValue,
  locale: localeProp,
  messages,
  name,
  placeholder,
  ...props
}: DatePickerProps): ReactElement {
  const strings = useMessages("datePicker", messages);
  const provided = useLocale();
  const locale = localeProp ?? provided;
  const input = useRef<HTMLInputElement>(null);
  const [own, setOwn] = useState(defaultValue);
  const current = value === undefined ? own : value;
  // The example is 31 December, so the day can't be mistaken for the month in any order.
  const [now] = useState(() => parseISODate(todayValue) ?? localToday());
  const example = formatLocalDate(toISODate({ year: now.year, month: 12, day: 31 }), locale);

  const setValue = (next: string | null) => {
    if (value === undefined) setOwn(next);
    if (next !== current) onValueChange?.(next);
  };

  const typed = useTypedValue(
    input,
    current ?? "",
    formatLocalDate(current ?? "", locale),
    (text) => {
      const iso = parseLocalDate(text, locale);
      return {
        value: iso,
        problem:
          iso === null
            ? fill(strings.invalid, { date: example })
            : limitProblem(iso, { min, max, isDateDisabled }, strings, locale),
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
      labelFor={strings.chooseFor}
      placeholder={placeholder ?? fill(strings.example, { date: example })}
      hiddenInputs={
        name !== undefined && (
          <input type="hidden" name={name} value={current ?? ""} disabled={props.disabled} />
        )
      }
    >
      {(calendar, close) => (
        <Calendar
          ref={calendar}
          value={current}
          min={min}
          max={max}
          isDateDisabled={isDateDisabled}
          today={todayValue}
          locale={locale}
          onValueChange={(iso) => {
            typed.settle();
            setValue(iso);
            close();
          }}
        />
      )}
    </PickerField>
  );
}
