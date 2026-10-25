"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { type ControlSize, iconSize, type QeetrixIcon } from "../internal/control";
import { cx } from "../internal/cx";
import { Spinner } from "../spinner/spinner";
import { Tooltip } from "../tooltip/tooltip";

export type ButtonVariant = "solid" | "soft" | "ghost";
export type ButtonTone = "brand" | "danger" | "neutral";

interface ButtonBaseProps extends Omit<ComponentProps<"button">, "children"> {
  /** Emphasis: `solid` (primary, Ember), `soft` (secondary, graphite), `ghost` (tertiary). */
  variant?: ButtonVariant;
  /**
   * `danger` for the confirming action of a destructive flow. `neutral` for ghost utility actions
   * in toolbars and headers, whose icons stay neutral (design rules §16); a solid or soft neutral
   * button looks like the soft one.
   */
  tone?: ButtonTone;
  /** Height from the density tokens. Default `md`. */
  size?: ControlSize;
  /** Busy: a spinner replaces the icon, clicks are ignored and `aria-busy` is set. */
  loading?: boolean;
  /** Render a different element through Base UI, e.g. a router link. */
  render?: BaseButton.Props["render"];
}

export interface ButtonProps extends ButtonBaseProps {
  /** The label. Write it as a verb: "Create invoice". */
  children?: ReactNode;
  /** A trailing icon from `@qeetrix/icons`; rendered in the sharp shape. */
  icon?: QeetrixIcon;
  /** Fill the width of the container (forms, mobile). */
  fullWidth?: boolean;
}

export interface IconButtonProps extends ButtonBaseProps {
  /** The icon, from `@qeetrix/icons`; rendered in the sharp shape. */
  icon: QeetrixIcon;
  /** Required: an icon-only button has no visible label. */
  "aria-label": string;
  /**
   * The tooltip, which shows the `aria-label` by default (06-component-specs.md §1). Pass other text
   * to show that instead, or `false` where the label is visible nearby.
   */
  tooltip?: ReactNode | false;
}

function content(icon: QeetrixIcon | undefined, size: ControlSize, loading: boolean): ReactNode {
  if (loading) return <Spinner decorative size={size === "lg" ? "lg" : "md"} />;
  if (!icon) return null;
  const Icon = icon;
  return (
    <Icon
      shape="sharp"
      size={iconSize(size)}
      aria-hidden
      className="qx-button-icon"
      data-slot="button-icon"
    />
  );
}

/**
 * An action. One `solid` and one `soft` per region, everything else `ghost` (design rules §7).
 * Disabled buttons stay focusable, so the reason they're disabled can be read.
 */
export function Button({
  variant = "solid",
  tone = "brand",
  size = "md",
  icon,
  loading = false,
  fullWidth,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps): ReactElement {
  return (
    <BaseButton
      {...props}
      type={type}
      disabled={disabled || loading}
      focusableWhenDisabled
      aria-busy={loading || undefined}
      className={cx("qx-button", className)}
      data-slot="button"
      data-variant={variant}
      data-tone={tone}
      data-size={size}
      data-icon={icon ? "" : undefined}
      data-loading={loading ? "" : undefined}
      data-full-width={fullWidth ? "" : undefined}
    >
      <span className="qx-button-label" data-slot="button-label">
        {children}
      </span>
      {content(icon, size, loading)}
    </BaseButton>
  );
}

/**
 * A square, icon-only button. Its `aria-label` is required by its type, and it shows as a tooltip.
 */
export function IconButton({
  variant = "ghost",
  tone = "brand",
  size = "md",
  icon,
  loading = false,
  tooltip,
  disabled,
  className,
  type = "button",
  ...props
}: IconButtonProps): ReactElement {
  const button = (
    <BaseButton
      {...props}
      type={type}
      disabled={disabled || loading}
      focusableWhenDisabled
      aria-busy={loading || undefined}
      className={cx("qx-button qx-icon-button", className)}
      data-slot="icon-button"
      data-variant={variant}
      data-tone={tone}
      data-size={size}
      data-icon=""
      data-loading={loading ? "" : undefined}
    >
      {content(icon, size, loading)}
    </BaseButton>
  );
  if (tooltip === false) return button;
  return <Tooltip content={tooltip ?? props["aria-label"]}>{button}</Tooltip>;
}
