"use client";

import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import type { IconProps } from "@qeetrix/icons";
import type { ComponentProps, ComponentType, ReactElement, ReactNode } from "react";
import { type ControlSize, iconSize, type QeetrixIcon } from "../internal/control";
import { cx } from "../internal/cx";

export interface ToggleProps
  extends Omit<ComponentProps<"button">, "value" | "defaultValue" | "onChange" | "children"> {
  /** Controlled pressed state. */
  pressed?: boolean;
  /** Initial pressed state when uncontrolled. */
  defaultPressed?: boolean;
  /** Called with the new pressed state and Base UI's event details. */
  onPressedChange?: BaseToggle.Props["onPressedChange"];
  /** The toggle's value inside a ToggleGroup. */
  value?: string;
  /** Height from the density tokens. Default `md`; a ToggleGroup's size wins inside the group. */
  size?: ControlSize;
  /** An icon from `@qeetrix/icons`, in the sharp shape. Icon-only toggles need `aria-label`. */
  icon?: QeetrixIcon;
  /** Show the icon's filled drawing while pressed. Only for icons that have one. */
  filledWhenPressed?: boolean;
  /** The label. */
  children?: ReactNode;
  /** Render a different element through Base UI. */
  render?: BaseToggle.Props["render"];
}

function FilledIcon({
  icon: Icon,
  size,
}: {
  icon: ComponentType<IconProps>;
  size: number;
}): ReactElement {
  return (
    <Icon
      shape="sharp"
      variant="filled"
      size={size}
      aria-hidden
      className="qx-toggle-icon-filled"
    />
  );
}

/** A pressed / not-pressed control: a tool, or one view among a few (inside a ToggleGroup). */
export function Toggle({
  size = "md",
  icon,
  filledWhenPressed,
  className,
  children,
  type = "button",
  ...props
}: ToggleProps): ReactElement {
  const Icon = icon;
  return (
    <BaseToggle
      {...props}
      type={type}
      className={cx("qx-toggle", className)}
      data-slot="toggle"
      data-size={size}
      data-icon-only={Icon && children === undefined ? "" : undefined}
    >
      {Icon ? (
        <Icon shape="sharp" size={iconSize(size)} aria-hidden className="qx-toggle-icon-outline" />
      ) : null}
      {Icon && filledWhenPressed ? (
        // `filledWhenPressed` is the caller's promise that this icon has a filled drawing.
        <FilledIcon icon={Icon as ComponentType<IconProps>} size={iconSize(size)} />
      ) : null}
      {children}
    </BaseToggle>
  );
}

export type ToggleGroupVariant = "segmented" | "separate";

export interface ToggleGroupProps
  extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "dir"> {
  /** Controlled pressed values. */
  value?: readonly string[];
  /** Initial pressed values when uncontrolled. */
  defaultValue?: readonly string[];
  /** Called with the pressed values and Base UI's event details. */
  onValueChange?: BaseToggleGroup.Props["onValueChange"];
  /** Allow several toggles pressed at once. Default: one at a time. */
  multiple?: boolean;
  /** Disable every toggle. */
  disabled?: boolean;
  /** Default `horizontal`. */
  orientation?: "horizontal" | "vertical";
  /** `segmented` (default): one joined control. `separate`: individual toggles with a gap. */
  variant?: ToggleGroupVariant;
  /** Height for every toggle in the group. Default `md`. */
  size?: ControlSize;
}

/** A row of toggles: a segmented control for one view among a few, or a set of tools. */
export function ToggleGroup({
  variant = "segmented",
  size = "md",
  orientation = "horizontal",
  className,
  ...props
}: ToggleGroupProps): ReactElement {
  return (
    <BaseToggleGroup
      {...props}
      orientation={orientation}
      className={cx("qx-toggle-group", className)}
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-orientation={orientation}
    />
  );
}
