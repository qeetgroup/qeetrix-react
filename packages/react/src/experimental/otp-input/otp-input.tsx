"use client";

import { OTPField } from "@base-ui/react/otp-field";
import { type CSSProperties, Fragment, type ReactElement, useId } from "react";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { fill } from "../../internal/template";
import { useMessages } from "../../provider/provider";

export type OTPInputSize = "md" | "lg";

export interface OTPInputProps
  extends Omit<OTPField.Root.Props, "className" | "style" | "children" | "render" | "length"> {
  /** How many characters. Default `6`. */
  length?: number;
  /** Split the slots into groups, e.g. `[3, 3]` shows 123 – 456. The sizes must add up to `length`. */
  groups?: readonly number[];
  /** `md` in consoles; `lg` on sign-in pages. Default `md`. */
  size?: OTPInputSize;
  /**
   * Names the code when there's no Field label: the group of slots and its first slot take it, and
   * the other slots say where they are ("Character 2 of 6").
   */
  "aria-label"?: string;
  /** The id of the element that names the code when there's no Field label, as `aria-label`. */
  "aria-labelledby"?: string;
  /** Placement only. */
  className?: string;
  /** Placement only, like `className`. */
  style?: CSSProperties;
  /** This input's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["otpInput"]>;
}

/**
 * A one-time code in separate slots, on Base UI's OTP Field: typing moves on, Backspace moves
 * back, pasting fills every slot, and the phone's SMS autofill (`autocomplete="one-time-code"`)
 * lands in one go. Numeric by default. The slots are a group named by the field's label (or
 * `aria-label`); the first slot takes that name too, and the others are announced as "Character 2
 * of 6". The slots share the container's width, and shrink to fit a narrow one.
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
  const groupId = useId();
  // The slots in groups: the indexes that start a new one, after the first.
  const breaks = new Set<number>();
  let at = 0;
  for (const group of groups ?? []) {
    at += group;
    if (at < length) breaks.add(at);
  }
  // The group carries the name. Base UI names the first slot from a Field label itself, but drops
  // an aria-label there, so a standalone code's first slot points at the named group instead.
  const firstSlotLabelledBy = ariaLabelledBy ?? (ariaLabel === undefined ? undefined : groupId);
  return (
    <OTPField.Root
      {...props}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      length={length}
      render={(rootProps) => <div {...rootProps} id={groupId} />}
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
              ? { "aria-labelledby": firstSlotLabelledBy }
              : { "aria-label": fill(strings.character, { index: index + 1, length }) })}
          />
        </Fragment>
      ))}
    </OTPField.Root>
  );
}
