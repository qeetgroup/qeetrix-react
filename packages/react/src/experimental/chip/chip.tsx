"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { CheckboxGroup as BaseCheckboxGroup } from "@base-ui/react/checkbox-group";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { CheckIcon } from "@qeetrix/icons/icons/check";
import { XIcon } from "@qeetrix/icons/icons/x";
import {
  type ComponentProps,
  type Context,
  type CSSProperties,
  createContext,
  type ReactElement,
  type ReactNode,
  use,
} from "react";
import { IconButton } from "../../button/button";
import { cx } from "../../internal/cx";
import { drawIcon, type IconSource } from "../../internal/icon";
import type { QeetrixMessages } from "../../internal/messages";
import { fill } from "../../internal/template";
import { useMessages } from "../../provider/provider";

/**
 * A chip's height: `sm` (`size.control.sm`, `label.sm`) for a filter row over a list; `md`
 * (`size.control.md`, the default); `lg` (`size.control.lg`), the fields' height.
 */
export type ChipSize = "sm" | "md" | "lg";

interface ChipLook {
  /** The label: one or two words, "Unread" or "Status: Active". */
  children: ReactNode;
  /** A 16px icon before the label, sharp. A selectable chip with one shows no check. */
  icon?: IconSource;
  /** Default `md`, or the ChipGroup's. */
  size?: ChipSize;
  /** Placement only. */
  className?: string;
  /** Placement only, like `className`. */
  style?: CSSProperties;
}

/**
 * A chip that turns on and off, such as a filter: a checkbox, with Base UI Checkbox's `checked` /
 * `defaultChecked` / `onCheckedChange`. In a ChipGroup it takes a `value`, and in a single-choice
 * group it's a radio.
 */
export interface SelectableChipProps
  extends ChipLook,
    Omit<BaseCheckbox.Root.Props, "className" | "style" | "children" | "render"> {
  onRemove?: undefined;
  removeLabel?: undefined;
  messages?: undefined;
}

/** A choice already made, such as an applied filter, with a button that takes it away. */
export interface RemovableChipProps
  extends ChipLook,
    Omit<ComponentProps<"span">, "children" | "className" | "style"> {
  /** Called by the remove button. Removing the chip (and focusing the next) is yours. */
  onRemove: () => void;
  /**
   * The remove button's name, for a label that isn't plain text. Default "Remove {label}", from a
   * string label.
   */
  removeLabel?: string;
  /** Greys the chip and its remove button. */
  disabled?: boolean;
  /** This chip's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["chip"]>;
}

/** Chip props: selectable (a checkbox, or a radio in a single-choice group), or removable. */
export type ChipProps = SelectableChipProps | RemovableChipProps;

interface ChipGroupState {
  multiple: boolean;
  size: ChipSize | undefined;
}

const ChipGroupContext: Context<ChipGroupState | null> = createContext<ChipGroupState | null>(null);

/**
 * An interactive tag (design rules §14: "an interactive or removable tag is a Chip"). Selectable,
 * it turns on and off: a checkbox, read with its label, chosen with the selected tint, a 2px Ember
 * edge and a check. Removable, it's a static label ending in a "Remove {label}" button. A static
 * status is a Badge; a whole applied-filters bar is FilterTags. 4px corners, as controls have: only
 * people and status are round.
 */
export function Chip(props: ChipProps): ReactElement {
  return props.onRemove ? <RemovableChip {...props} /> : <SelectableChip {...props} />;
}

function Label({ children }: { children: ReactNode }): ReactElement {
  return (
    <span className="qx-chip-label" data-slot="chip-label">
      {children}
    </span>
  );
}

/** The leading icon, or the check that marks a chosen chip, so the choice never rests on colour. */
function Mark({ icon, check }: { icon: IconSource | undefined; check: ReactElement }) {
  return icon
    ? drawIcon(icon, { size: 16, className: "qx-chip-icon", "data-slot": "chip-icon" })
    : check;
}

const checkMark = <CheckIcon shape="sharp" size={16} aria-hidden />;

function SelectableChip({
  children,
  icon,
  size,
  className,
  style,
  onRemove: _onRemove,
  removeLabel: _removeLabel,
  messages: _messages,
  checked,
  defaultChecked,
  onCheckedChange,
  indeterminate: _indeterminate,
  parent: _parent,
  uncheckedValue: _uncheckedValue,
  value,
  ...props
}: SelectableChipProps): ReactElement {
  const group = use(ChipGroupContext);
  const look = {
    className: cx("qx-chip", className),
    style,
    "data-slot": "chip",
    "data-size": size ?? group?.size ?? "md",
  };
  // A single-choice group: each chip is a radio, the group one tab stop with arrow keys.
  if (group && !group.multiple) {
    return (
      <BaseRadio.Root {...props} {...look} value={value}>
        <Mark
          icon={icon}
          check={
            <BaseRadio.Indicator className="qx-chip-check" data-slot="chip-check">
              {checkMark}
            </BaseRadio.Indicator>
          }
        />
        <Label>{children}</Label>
      </BaseRadio.Root>
    );
  }
  return (
    <BaseCheckbox.Root
      {...props}
      {...look}
      {...(value === undefined ? {} : { value })}
      {...(checked === undefined ? {} : { checked })}
      {...(defaultChecked === undefined ? {} : { defaultChecked })}
      {...(onCheckedChange === undefined ? {} : { onCheckedChange })}
    >
      <Mark
        icon={icon}
        check={
          <BaseCheckbox.Indicator className="qx-chip-check" data-slot="chip-check">
            {checkMark}
          </BaseCheckbox.Indicator>
        }
      />
      <Label>{children}</Label>
    </BaseCheckbox.Root>
  );
}

function RemovableChip({
  children,
  icon,
  size,
  onRemove,
  removeLabel,
  disabled,
  messages,
  className,
  style,
  ...props
}: RemovableChipProps): ReactElement {
  const group = use(ChipGroupContext);
  const strings = useMessages("chip", messages);
  const name =
    removeLabel ??
    (typeof children === "string"
      ? fill(strings.remove, { label: children })
      : strings.removePlain);
  return (
    <span
      {...props}
      className={cx("qx-chip", className)}
      style={style}
      data-slot="chip"
      data-size={size ?? group?.size ?? "md"}
      data-removable=""
      data-disabled={disabled ? "" : undefined}
    >
      {icon && drawIcon(icon, { size: 16, className: "qx-chip-icon", "data-slot": "chip-icon" })}
      <Label>{children}</Label>
      <IconButton
        icon={XIcon}
        aria-label={name}
        size="sm"
        tone="neutral"
        tooltip={false}
        disabled={disabled}
        className="qx-chip-remove"
        onClick={() => onRemove()}
      />
    </span>
  );
}

interface ChipGroupOwnProps {
  /** Names the group for assistive technology, e.g. "Status". It isn't shown. */
  label: string;
  /** Every chip's size. Default `md`. */
  size?: ChipSize;
  /** The Chips, each with its `value`. */
  children?: ReactNode;
  /** Placement only. */
  className?: string;
  /** Placement only, like `className`. */
  style?: CSSProperties;
}

/** One value from a set: the chips are radios, one tab stop, arrow keys moving the choice. */
export interface SingleChipGroupProps
  extends ChipGroupOwnProps,
    Omit<BaseRadioGroup.Props<string>, "className" | "style" | "render" | "children"> {
  /** Any number of values instead of one. */
  multiple?: false;
}

/** Any number of values from a set: each chip is a checkbox, and `value` the array of chosen ones. */
export interface MultipleChipGroupProps
  extends ChipGroupOwnProps,
    Omit<BaseCheckboxGroup.Props, "className" | "style" | "render" | "children"> {
  /** Any number of values instead of one. */
  multiple: true;
}

/** ChipGroup props: one value (`multiple` off, the default), or several. */
export type ChipGroupProps = SingleChipGroupProps | MultipleChipGroupProps;

/**
 * Chips that choose from a set, wrapping onto more lines where they don't fit: one value (radios),
 * or several with `multiple` (checkboxes), as `value` / `defaultValue` / `onValueChange`. Named by
 * `label`, which isn't shown; put a visible heading beside it where the page needs one.
 */
export function ChipGroup(props: ChipGroupProps): ReactElement {
  if (props.multiple) {
    const { multiple: _multiple, label, size, className, ...rest } = props;
    return (
      <ChipGroupContext value={{ multiple: true, size }}>
        <BaseCheckboxGroup
          {...rest}
          aria-label={label}
          className={cx("qx-chip-group", className)}
          data-slot="chip-group"
        />
      </ChipGroupContext>
    );
  }
  const { multiple: _multiple, label, size, className, ...rest } = props;
  return (
    <ChipGroupContext value={{ multiple: false, size }}>
      <BaseRadioGroup<string>
        {...rest}
        aria-label={label}
        className={cx("qx-chip-group", className)}
        data-slot="chip-group"
      />
    </ChipGroupContext>
  );
}
