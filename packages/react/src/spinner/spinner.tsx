import type { ComponentProps, ReactElement } from "react";
import { cx } from "../internal/cx";
import { messages } from "../internal/messages";

export type SpinnerSize = "sm" | "md" | "lg" | "xl";
export type SpinnerTone = "default" | "brand";

export interface SpinnerProps extends Omit<ComponentProps<"span">, "children"> {
  /** `sm` 14px, `md` 16px (default), `lg` 20px, `xl` 24px. */
  size?: SpinnerSize;
  /** `default` follows the text colour; `brand` is Ember. */
  tone?: SpinnerTone;
  /** The accessible name. Default "Loading". */
  label?: string;
  /** Hidden from assistive technology, when something else announces the wait (a busy Button). */
  decorative?: boolean;
}

/** An indeterminate wait: a 2px ring that turns, or fades under reduced motion. */
export function Spinner({
  size,
  tone,
  label = messages.spinner.label,
  decorative,
  className,
  ...props
}: SpinnerProps): ReactElement {
  return (
    <span
      {...(decorative ? { "aria-hidden": true } : { role: "status", "aria-label": label })}
      {...props}
      className={cx("qx-spinner", className)}
      data-slot="spinner"
      data-size={size}
      data-tone={tone}
    />
  );
}
