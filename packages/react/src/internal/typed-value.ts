"use client";

import { type RefObject, useEffect, useRef, useState } from "react";
import { formatLocalDate, parseISODate } from "./date";
import { fill } from "./template";

/** What typed text reads as: a value, or the reason it can't be one. */
export interface Reading<T> {
  value: T | null;
  problem: string;
}

/** A field you type a value into (DatePicker, DateRangePicker). */
export interface TypedValue {
  /** What the field shows: the text being typed, or the value written out. */
  text: string;
  /** The field's text changed. */
  edit: (text: string) => void;
  /** Read the typed text: on leaving the field, or on Enter. */
  read: () => void;
  /** A value came from elsewhere, such as the calendar: drop the typed text and its error. */
  settle: () => void;
}

/**
 * Typed text for a value field. The text shows until it's read, or until the value changes from
 * outside. Empty text reads as no value. Text that can't be used keeps showing, commits `null` and
 * becomes the input's custom validity, so Field shows why and Form stops the submit; typing again
 * clears it until the next read.
 *
 * `key` is the current value as a string, "" for none; `shown` is the current value written out.
 */
export function useTypedValue<T>(
  input: RefObject<HTMLInputElement | null>,
  key: string,
  shown: string,
  parse: (text: string) => Reading<T>,
  commit: (value: T | null) => void,
): TypedValue {
  const [draft, setDraft] = useState<{ text: string; base: string } | null>(null);
  const editing = draft !== null && draft.base === key;

  // The message this field set as the input's custom validity, if any.
  const reported = useRef("");
  const report = (message: string) => {
    if (!message && !reported.current) return;
    input.current?.setCustomValidity(message);
    reported.current = message;
  };
  useEffect(() => {
    if (editing || !reported.current) return;
    input.current?.setCustomValidity("");
    reported.current = "";
  }, [editing, input]);

  return {
    text: editing ? draft.text : shown,
    edit: (text) => {
      report("");
      setDraft({ text, base: key });
    },
    read: () => {
      if (draft === null || draft.base !== key) return;
      const typed = draft.text.trim();
      const { value, problem } = typed === "" ? { value: null, problem: "" } : parse(typed);
      report(problem);
      commit(problem ? null : value);
      setDraft(problem ? { text: draft.text, base: "" } : null);
    },
    settle: () => {
      report("");
      setDraft(null);
    },
  };
}

/** The dates a field allows. */
export interface DateLimits {
  min?: string | undefined;
  max?: string | undefined;
  isDateDisabled?: ((date: string) => boolean) | undefined;
}

/** Why a typed date isn't allowed, or "" when it is. Each message names the date it means. */
export function limitProblem(
  iso: string,
  { min, max, isDateDisabled }: DateLimits,
  strings: { tooEarly: string; tooLate: string; unavailable: string },
  locale: string,
): string {
  if (min && parseISODate(min) && iso < min) {
    return fill(strings.tooEarly, { date: formatLocalDate(min, locale) });
  }
  if (max && parseISODate(max) && iso > max) {
    return fill(strings.tooLate, { date: formatLocalDate(max, locale) });
  }
  if (isDateDisabled?.(iso))
    return fill(strings.unavailable, { date: formatLocalDate(iso, locale) });
  return "";
}
