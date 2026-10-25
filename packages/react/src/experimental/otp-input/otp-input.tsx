"use client";

import { OTPField } from "@base-ui/react/otp-field";
import { type CSSProperties, Fragment, type ReactElement } from "react";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { fill } from "../../internal/template";
import { useMessages } from "../../provider/provider";

export type OTPInputSize = "md" | "lg";

export interface OTPInputProps
  extends Omit<OTPField.Root.Props, "className" | "style" | "children" | "render" | "length"> {
  /** How many characters. Default 6. */
  length?: number;
  /** Split the slots into groups, e.g. `[3, 3]` shows 123 – 456. The sizes must add up to `length`. */
  groups?: readonly number[];
  /** `md` (default) in consoles; `lg` on sign-in pages. */
  size?: OTPInputSize;
  /** Names the first slot when there's no Field label. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  /** Placement only. */
  className?: string;
  style?: CSSProperties;
  /** This input's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["otpInput"]>;
}

/**
 * A one-time code in separate slots (07-components.md, C2), on Base UI's OTP Field: typing moves on,
 * Backspace moves back, pasting fills every slot, and the phone's SMS autofill
 * (`autocomplete="one-time-code"`) lands in one go. Numeric by default. The first slot takes the
 * field's label; the others are announced as "Character 2 of 6".
 */
export function OTPInput({
  length = 6,
  groups,
  size = "md",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
  style,
  messages,
  ...props
}: OTPInputProps): ReactElement {
  const strings = useMessages("otpInput", messages);
  // The slot indexes that start a new group, after the first.
  const breaks = new Set<number>();
  let at = 0;
  for (const group of groups ?? []) {
    at += group;
    if (at < length) breaks.add(at);
  }
  return (
    <OTPField.Root
      {...props}
      length={length}
      className={cx("qx-otp-input", className)}
      style={style}
      data-slot="otp-input"
      data-size={size}
    >
      {Array.from({ length }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: slots are positions, fixed by `length`
        <Fragment key={index}>
          {breaks.has(index) && <OTPField.Separator className="qx-otp-input-separator" />}
          <OTPField.Input
            className="qx-otp-input-slot"
            data-slot="otp-input-slot"
            {...(index === 0
              ? { "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy }
              : {
                  "aria-label": fill(strings.character, { index: index + 1, length }),
                })}
          />
        </Fragment>
      ))}
    </OTPField.Root>
  );
}
