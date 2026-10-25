"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { type ChoiceLabelProps, ChoiceRow } from "../field/choice";
import { cx } from "../internal/cx";

interface SwitchOwnProps extends Omit<BaseSwitch.Root.Props, "className" | "style" | "children"> {
  /** A line under the label. */
  description?: ReactNode;
  /** Placement of the row (or of the control alone, with no label) only. */
  className?: string;
  /** Placement only, like `className`. */
  style?: CSSProperties;
}

/** Switch props: Base UI's, plus `label` — or, with no visible label, a required `aria-label`. */
export type SwitchProps = SwitchOwnProps & ChoiceLabelProps;

/** Turns a setting on or off immediately. A setting that waits for a Save button is a Checkbox. */
export function Switch({
  label,
  description,
  className,
  style,
  ...props
}: SwitchProps): ReactElement {
  return (
    <ChoiceRow
      kind="switch"
      label={label}
      description={description}
      disabled={props.disabled}
      className={className}
      style={style}
    >
      <BaseSwitch.Root
        {...props}
        className={cx("qx-switch", label == null ? className : undefined)}
        style={label == null ? style : undefined}
        data-slot="switch-track"
      >
        <BaseSwitch.Thumb className="qx-switch-thumb" data-slot="switch-thumb" />
      </BaseSwitch.Root>
    </ChoiceRow>
  );
}
