import { type ComponentProps, type ReactElement, useId } from "react";
import { cx } from "../internal/cx";
import { SpinnerLabel } from "./spinner-label";

export type SpinnerSize = "sm" | "md" | "lg" | "xl";

/**
 * `neutral` follows the text colour; `brand` is Ember. Deprecated: `default`, the old name for
 * `neutral`, kept so existing code works.
 */
export type SpinnerTone = "neutral" | "brand" | "default";

export interface SpinnerProps extends Omit<ComponentProps<"span">, "children"> {
  /** `sm` 14px, `md` 16px, `lg` 20px or `xl` 24px. Default `md`. */
  size?: SpinnerSize;
  /**
   * `neutral` (the name Button, Badge and EmptyState use) follows the text colour; `brand` is
   * Ember. Deprecated: `default`, an alias of `neutral`. Default `neutral`.
   */
  tone?: SpinnerTone;
  /**
   * The accessible name. Default: QeetrixProvider's `spinner.label`, "Loading" in English, "लोड हो
   * रहा है" in Hindi.
   */
  label?: string;
  /** Hidden from assistive technology, when something else announces the wait (a busy Button). */
  decorative?: boolean;
}

/**
 * An indeterminate wait: a 2px ring that turns, or fades under reduced motion. Server-safe: without
 * a `label`, a small client child reads QeetrixProvider's string, so the name follows the app's
 * language.
 */
export function Spinner({
  size,
  tone,
  label,
  decorative,
  className,
  ...props
}: SpinnerProps): ReactElement {
  const labelId = useId();
  // The provider's string is the fallback: an explicit `label`, `aria-label` or `aria-labelledby`
  // names the spinner instead.
  const provided =
    !decorative &&
    label === undefined &&
    props["aria-label"] === undefined &&
    props["aria-labelledby"] === undefined;
  return (
    <span
      {...(decorative
        ? { "aria-hidden": true }
        : {
            role: "status",
            ...(provided ? { "aria-labelledby": labelId } : {}),
            ...(label === undefined ? {} : { "aria-label": label }),
          })}
      {...props}
      className={cx("qx-spinner", className)}
      data-slot="spinner"
      data-size={size}
      data-tone={tone}
    >
      {provided && <SpinnerLabel id={labelId} />}
    </span>
  );
}
