"use client";

import { CircleAlertIcon } from "@qeetrix/icons/icons/circle-alert";
import { CircleCheckIcon } from "@qeetrix/icons/icons/circle-check";
import { CircleMinusIcon } from "@qeetrix/icons/icons/circle-minus";
import { InfoIcon } from "@qeetrix/icons/icons/info";
import { MailIcon } from "@qeetrix/icons/icons/mail";
import { XIcon } from "@qeetrix/icons/icons/x";
import { type ReactElement, type ReactNode, useRef, useState } from "react";
import { IconButton } from "../../button/button";
import { Input, type InputProps } from "../../input/input";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { fill } from "../../internal/template";
import { useMessages } from "../../provider/provider";
import { VisuallyHidden } from "../../visually-hidden/visually-hidden";

/**
 * What happens to an address: `success` (a new invitation, say), `info` (an existing one sent
 * again), `skipped` (already a member: struck through), `danger` (it can't be used), or `neutral`
 * while nothing is known yet.
 */
export type EmailEntryTone = "neutral" | "success" | "info" | "skipped" | "danger";

/** An address's state, from the product: its tone and a short note, "Already a member". */
export interface EmailEntryState {
  tone?: EmailEntryTone;
  note?: ReactNode;
}

export interface MultiEmailFieldProps
  extends Omit<
    InputProps,
    "value" | "defaultValue" | "onChange" | "onValueChange" | "type" | "max" | "children"
  > {
  /** The addresses, for a controlled field. */
  value?: readonly string[] | undefined;
  /** The addresses at first, for an uncontrolled field. */
  defaultValue?: readonly string[] | undefined;
  /** Called with every address after one is added or removed. */
  onValueChange?: ((value: string[]) => void) | undefined;
  /**
   * Each address's state, from the product: `(email) => ({ tone: "skipped", note: "Already a
   * member" })`. An address that isn't an email address is `danger`, "Not an email address", first.
   */
  check?: ((email: string) => EmailEntryState | undefined) | undefined;
  /** The most addresses at a time. The ones past it stay in the box, and a message says so. */
  max?: number | undefined;
  /** This field's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["multiEmailField"]> | undefined;
}

/**
 * An email address's shape: one @ with something before it, no spaces, and a dot inside the part
 * after it. Checked by position, not by a regular expression, so a long pasted string can't make
 * it backtrack (polynomial ReDoS).
 */
function isEmail(text: string): boolean {
  if (text.length > 254 || /\s/.test(text)) return false;
  const at = text.indexOf("@");
  if (at < 1 || at !== text.lastIndexOf("@")) return false;
  const domain = text.slice(at + 1);
  const dot = domain.lastIndexOf(".");
  return dot > 0 && dot < domain.length - 1;
}
const SEPARATORS = /[\s,;]+/;
const ICONS = {
  neutral: MailIcon,
  success: CircleCheckIcon,
  info: InfoIcon,
  skipped: CircleMinusIcon,
  danger: CircleAlertIcon,
} as const;

/**
 * Several email addresses in one field: typed, pasted (a column from a spreadsheet) or separated
 * by commas, spaces or new lines. Each becomes a ruled row under the box with its state from
 * `check` (what will happen to it) and a remove button; Backspace in the empty box removes the
 * last. Additions and removals are announced, and so is a state as it changes. Use in a Field.
 */
export function MultiEmailField({
  value: valueProp,
  defaultValue = [],
  onValueChange,
  check,
  max,
  messages,
  className,
  style,
  onKeyDown,
  onPaste,
  onBlur,
  disabled,
  ...props
}: MultiEmailFieldProps): ReactElement {
  const strings = useMessages("multiEmailField", messages);
  const [uncontrolled, setUncontrolled] = useState<readonly string[]>(defaultValue);
  const value = valueProp ?? uncontrolled;
  const [draft, setDraft] = useState("");
  const [limited, setLimited] = useState(false);
  const [said, setSaid] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const change = (next: string[]) => {
    if (valueProp === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  /** Adds what's typed or pasted; what's past `max` stays in the box. */
  const add = (text: string) => {
    const known = new Set(value.map((email) => email.toLowerCase()));
    const fresh: string[] = [];
    for (const part of text.split(SEPARATORS)) {
      const email = part.trim();
      if (!email || known.has(email.toLowerCase())) continue;
      known.add(email.toLowerCase());
      fresh.push(email);
    }
    const room = max === undefined ? fresh.length : Math.max(max - value.length, 0);
    const taken = fresh.slice(0, room);
    const left = fresh.slice(room);
    setDraft(left.join(", "));
    setLimited(left.length > 0);
    if (taken.length) {
      change([...value, ...taken]);
      setSaid(fill(strings.added, { list: taken.join(", ") }));
    }
  };

  const remove = (email: string) => {
    change(value.filter((entry) => entry !== email));
    setLimited(false);
    setSaid(fill(strings.removed, { value: email }));
    input.current?.focus();
  };

  const state = (email: string): EmailEntryState =>
    isEmail(email) ? (check?.(email) ?? {}) : { tone: "danger", note: strings.invalid };

  const keyDown = (event: Parameters<NonNullable<InputProps["onKeyDown"]>>[0]) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if ((event.key === "Enter" || event.key === "," || event.key === ";") && draft.trim()) {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && draft === "" && value.length) {
      event.preventDefault();
      remove(value[value.length - 1] as string);
    }
  };

  const paste = (event: Parameters<NonNullable<InputProps["onPaste"]>>[0]) => {
    onPaste?.(event);
    if (event.defaultPrevented) return;
    const text = event.clipboardData.getData("text");
    if (!SEPARATORS.test(text.trim())) return;
    event.preventDefault();
    add(`${draft} ${text}`);
  };

  return (
    <div
      className={cx("qx-multi-email-field", className)}
      style={style}
      data-slot="multi-email-field"
    >
      <Input
        {...props}
        ref={input}
        type="text"
        inputMode="email"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        value={draft}
        onChange={(event) => {
          const text = event.currentTarget.value;
          setLimited(false);
          if (/[\s,;]$/.test(text) && text.trim()) add(text);
          else setDraft(text);
        }}
        onKeyDown={keyDown}
        onPaste={paste}
        onBlur={(event) => {
          onBlur?.(event);
          if (draft.trim() && !limited) add(draft);
        }}
      />
      {limited && max !== undefined && (
        <p className="qx-multi-email-field-limit" data-slot="multi-email-field-limit">
          {fill(strings.limit, { max: String(max) })}
        </p>
      )}
      {value.length > 0 && (
        <ul className="qx-multi-email-field-entries" aria-label={strings.entries}>
          {value.map((email) => {
            const { tone = "neutral", note } = state(email);
            const Icon = ICONS[tone];
            return (
              <li key={email} className="qx-multi-email-field-entry" data-tone={tone}>
                <Icon shape="sharp" size={16} aria-hidden className="qx-multi-email-field-icon" />
                <span className="qx-multi-email-field-email">{email}</span>
                <span className="qx-multi-email-field-note" aria-live="polite">
                  {note != null && (
                    <>
                      <VisuallyHidden>, </VisuallyHidden>
                      {note}
                    </>
                  )}
                </span>
                <IconButton
                  icon={XIcon}
                  size="sm"
                  tone="neutral"
                  tooltip={false}
                  disabled={disabled}
                  aria-label={fill(strings.remove, { value: email })}
                  onClick={() => remove(email)}
                />
              </li>
            );
          })}
        </ul>
      )}
      <VisuallyHidden aria-live="polite">{said}</VisuallyHidden>
    </div>
  );
}
