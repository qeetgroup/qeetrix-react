"use client";

import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { type ComponentProps, type ReactElement, type ReactNode, useEffect } from "react";
import { type ControlSize, iconSize } from "../internal/control";
import { cx } from "../internal/cx";
import { drawIcon, type IconSource } from "../internal/icon";
import { Tooltip, type TooltipProps } from "../tooltip/tooltip";

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
  /**
   * An icon from `@qeetrix/icons`, in the sharp shape. A toggle with only an icon needs an
   * `aria-label`, which it shows as a tooltip.
   */
  icon?: IconSource;
  /**
   * Show the icon's filled drawing while pressed; only for icons that have one. Default `false`.
   */
  filledWhenPressed?: boolean;
  /**
   * An icon-only toggle's tooltip, which shows its `aria-label` by default. Pass other text to show
   * that instead, or `false` where the label is visible nearby. A toggle with a visible label has
   * no tooltip.
   */
  tooltip?: ReactNode | false;
  /**
   * The side an icon-only toggle's tooltip opens on. Default `top`; it flips when there is no room.
   */
  tooltipSide?: TooltipProps["side"];
  /** The label. */
  children?: ReactNode;
  /** Render a different element through Base UI. */
  render?: BaseToggle.Props["render"];
}

/**
 * A pressed / not-pressed control: a tool, or one view among a few (inside a ToggleGroup). With
 * only an icon, it's named by its `aria-label` and shows it as a tooltip, like IconButton.
 */
export function Toggle({
  size = "md",
  icon,
  filledWhenPressed,
  tooltip,
  tooltipSide = "top",
  className,
  children,
  type = "button",
  ...props
}: ToggleProps): ReactElement {
  const Icon = icon;
  const iconOnly = Icon !== undefined && children === undefined;
  const label = props["aria-label"];
  const named = Boolean(label || props["aria-labelledby"]);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && iconOnly && !named) {
      console.warn(
        "Qeetrix: a Toggle with only an icon needs an `aria-label`; it's the name and the tooltip.",
      );
    }
  }, [iconOnly, named]);
  const toggle = (
    <BaseToggle
      {...props}
      type={type}
      className={cx("qx-toggle", className)}
      data-slot="toggle"
      data-size={size}
      data-icon-only={iconOnly ? "" : undefined}
    >
      {Icon
        ? drawIcon(Icon, {
            size: iconSize(size),
            className: "qx-toggle-icon-outline",
            "data-slot": "toggle-icon",
          })
        : null}
      {Icon && filledWhenPressed
        ? // `filledWhenPressed` is the caller's promise that this icon has a filled drawing.
          drawIcon(Icon, {
            size: iconSize(size),
            variant: "filled",
            className: "qx-toggle-icon-filled",
            "data-slot": "toggle-icon-filled",
          })
        : null}
      {children}
    </BaseToggle>
  );
  if (!iconOnly || tooltip === false) return toggle;
  // Always wrapped while icon-only, so the element tree (and focus) survive a label change.
  const text = tooltip ?? label;
  return (
    <Tooltip content={text} side={tooltipSide} disabled={text == null || text === ""}>
      {toggle}
    </Tooltip>
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
  /** Allow several toggles pressed at once; otherwise one at a time. Default `false`. */
  multiple?: boolean;
  /** Disable every toggle. */
  disabled?: boolean;
  /** How the toggles line up, and which arrow keys move between them. Default `horizontal`. */
  orientation?: "horizontal" | "vertical";
  /**
   * `segmented`: one joined control. `separate`: separate toggles with a gap. Default `segmented`.
   */
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
