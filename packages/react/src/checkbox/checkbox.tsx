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
  type ChoiceVariant,
} from "../field/choice";
import type { FieldMessageProps } from "../field/field";
import type { QeetrixIcon } from "../internal/control";
import { cx } from "../internal/cx";

interface CheckboxOwnProps
  extends Omit<BaseCheckbox.Root.Props, "className" | "style" | "children"> {
  /** A line under the label. */
  description?: ReactNode;
  /** An icon before the label; on a tile, in a box at its start. */
  icon?: QeetrixIcon;
  /** Placement of the row (or of the control alone, with no label) only. */
  className?: string;
  /** Placement only, like `className`. */
  style?: CSSProperties;
}

/** Checkbox props: Base UI's, plus `label` — or, with no visible label, a required `aria-label`. */
export type CheckboxProps = CheckboxOwnProps & ChoiceLabelProps;

/** The tick, or the dash while mixed: from Base UI's state, so a `parent` checkbox shows it too. */
const mark: NonNullable<BaseCheckbox.Indicator.Props["render"]> = (props, state) => {
  const Mark = state.indeterminate ? MinusIcon : CheckIcon;
  return (
    <span {...props}>
      <Mark shape="sharp" size={12} strokeWidth={3} aria-hidden />
    </span>
  );
};

/**
 * Turns one option on or off, or picks several inside a CheckboxGroup. `ref` and Base UI props go
 * to the control; the label makes the whole row the click target. Mixed (`indeterminate`, or a
 * `parent` whose group is partly checked) shows a dash.
 */
export function Checkbox({
  label,
  description,
  icon,
  className,
  style,
  ...props
}: CheckboxProps): ReactElement {
  return (
    <ChoiceRow
      kind="checkbox"
      label={label}
      description={description}
      disabled={props.disabled}
      icon={icon}
      className={className}
      style={style}
    >
      <BaseCheckbox.Root
        {...props}
        className={cx("qx-checkbox", label == null ? className : undefined)}
        style={label == null ? style : undefined}
        data-slot="checkbox-indicator"
      >
        <BaseCheckbox.Indicator
          className="qx-checkbox-mark"
          data-slot="checkbox-mark"
          render={mark}
        />
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
  /** `vertical`, or `horizontal` for short options. Default `vertical`. */
  orientation?: ChoiceOrientation;
  /**
   * `default` rows, or `tile`s: boxes with an icon, a title and a line, the whole tile clickable.
   * Default `default`.
   */
  variant?: ChoiceVariant;
  /** For tiles: the most columns, fewer where there isn't room. Default `1`. */
  columns?: 1 | 2 | 3 | 4;
  /** Placement only (margin, width, grid placement). */
  className?: string;
  /** Placement only, like `className`. */
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
  variant = "default",
  columns = 1,
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
      variant={variant}
      columns={columns}
      className={className}
      style={style}
      group={<BaseCheckboxGroup {...props} disabled={disabled} />}
    >
      {children}
    </ChoiceGroup>
  );
}
