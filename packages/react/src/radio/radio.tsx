"use client";

import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import {
  ChoiceGroup,
  type ChoiceLabelProps,
  type ChoiceOrientation,
  ChoiceRow,
} from "../field/choice";
import type { FieldMessageProps } from "../field/field";
import { cx } from "../internal/cx";

interface RadioOwnProps<Value>
  extends Omit<BaseRadio.Root.Props<Value>, "className" | "style" | "children"> {
  /** A line under the label. */
  description?: ReactNode;
  /** Placement of the row (or of the control alone, with no label) only. */
  className?: string;
  style?: CSSProperties;
}

/** Radio props: Base UI's (`value` required), plus `label` — or a required `aria-label`. */
export type RadioProps<Value = string> = RadioOwnProps<Value> & ChoiceLabelProps;

/** One option of a RadioGroup (06-component-specs.md §3). The 5px Ember ring is its border. */
export function Radio<Value = string>({
  label,
  description,
  className,
  style,
  ...props
}: RadioProps<Value>): ReactElement {
  return (
    <ChoiceRow
      kind="radio"
      label={label}
      description={description}
      disabled={props.disabled}
      className={className}
      style={style}
    >
      <BaseRadio.Root
        {...props}
        className={cx("qx-radio", label == null ? className : undefined)}
        style={label == null ? style : undefined}
        data-slot="radio-indicator"
      />
    </ChoiceRow>
  );
}

export interface RadioGroupProps<Value = string>
  extends Omit<BaseRadioGroup.Props<Value>, "className" | "style" | "render">,
    FieldMessageProps {
  /** The question, shown as the group's legend. */
  label: ReactNode;
  /** `vertical` (default) or `horizontal` for short options. */
  orientation?: ChoiceOrientation;
  /** Placement only (margin, width, grid placement). */
  className?: string;
  style?: CSSProperties;
}

/**
 * One choice from a set, always answered: arrow keys move and select, and the group is one tab
 * stop. Generic over the value: `RadioGroup<"monthly" | "yearly">`.
 */
export function RadioGroup<Value = string>({
  label,
  description,
  error,
  name,
  disabled,
  orientation = "vertical",
  className,
  style,
  children,
  ...props
}: RadioGroupProps<Value>): ReactElement {
  return (
    <ChoiceGroup
      kind="radio"
      label={label}
      description={description}
      error={error}
      name={name}
      disabled={disabled}
      orientation={orientation}
      className={className}
      style={style}
      group={<BaseRadioGroup<Value> {...props} disabled={disabled} />}
    >
      {children}
    </ChoiceGroup>
  );
}
