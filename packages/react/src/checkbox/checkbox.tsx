"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { CheckboxGroup as BaseCheckboxGroup } from "@base-ui/react/checkbox-group";
import { CheckIcon } from "@qeetrix/icons/icons/check";
import { MinusIcon } from "@qeetrix/icons/icons/minus";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import {
  ChoiceGroup,
  type ChoiceLabelProps,
  type ChoiceOrientation,
  ChoiceRow,
} from "../field/choice";
import type { FieldMessageProps } from "../field/field";
import { cx } from "../internal/cx";

interface CheckboxOwnProps
  extends Omit<BaseCheckbox.Root.Props, "className" | "style" | "children"> {
  /** A line under the label. */
  description?: ReactNode;
  /** Placement of the row (or of the control alone, with no label) only. */
  className?: string;
  style?: CSSProperties;
}

/** Checkbox props: Base UI's, plus `label` — or, with no visible label, a required `aria-label`. */
export type CheckboxProps = CheckboxOwnProps & ChoiceLabelProps;

/**
 * Turns one option on or off, or picks several inside a CheckboxGroup (06-component-specs.md §3).
 * `ref` and Base UI props go to the control; the label makes the whole row the click target.
 */
export function Checkbox({
  label,
  description,
  className,
  style,
  indeterminate,
  ...props
}: CheckboxProps): ReactElement {
  const Mark = indeterminate ? MinusIcon : CheckIcon;
  return (
    <ChoiceRow
      kind="checkbox"
      label={label}
      description={description}
      disabled={props.disabled}
      className={className}
      style={style}
    >
      <BaseCheckbox.Root
        {...props}
        indeterminate={indeterminate}
        className={cx("qx-checkbox", label == null ? className : undefined)}
        style={label == null ? style : undefined}
        data-slot="checkbox-indicator"
      >
        <BaseCheckbox.Indicator className="qx-checkbox-mark" data-slot="checkbox-mark">
          <Mark shape="sharp" size={12} strokeWidth={3} aria-hidden />
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
    </ChoiceRow>
  );
}

export interface CheckboxGroupProps
  extends Omit<BaseCheckboxGroup.Props, "className" | "style" | "render">,
    FieldMessageProps {
  /** The question, shown as the group's legend. */
  label: ReactNode;
  /** The field name the checked values submit under. */
  name?: string;
  /** `vertical` (default) or `horizontal` for short options. */
  orientation?: ChoiceOrientation;
  /** Placement only (margin, width, grid placement). */
  className?: string;
  style?: CSSProperties;
}

/** Several options under one question; `value` is the array of checked options' values. */
export function CheckboxGroup({
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
}: CheckboxGroupProps): ReactElement {
  return (
    <ChoiceGroup
      kind="checkbox"
      label={label}
      description={description}
      error={error}
      name={name}
      disabled={disabled}
      orientation={orientation}
      className={className}
      style={style}
      group={<BaseCheckboxGroup {...props} disabled={disabled} />}
    >
      {children}
    </ChoiceGroup>
  );
}
