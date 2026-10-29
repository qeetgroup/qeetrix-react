import type { ComponentProps, ReactElement } from "react";
import { cx } from "../internal/cx";
import { drawIcon, type IconSource } from "../internal/icon";

export type BadgeTone = "neutral" | "brand" | "info" | "success" | "warning" | "danger";

/** `subtle`, the tinted pill, for most statuses; `solid`, the bold fill, for the one that must stand out. */
export type BadgeVariant = "subtle" | "solid";

/** `md` 20px; `sm` 16px, for tight rows and beside small text. */
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends ComponentProps<"span"> {
  /** The word carries the meaning; the tone only reinforces it. Default `neutral`. */
  tone?: BadgeTone;
  /**
   * `subtle`: the tone's tint with the tone's text. `solid`: the tone's bold fill with white text
   * (dark text on warning), for the one status in a view that must stand out, such as "Overdue".
   * Default `subtle`.
   */
  variant?: BadgeVariant;
  /** `md` (20px) or `sm` (16px), for tight rows and beside small text. Default `md`. */
  size?: BadgeSize;
  /** A leading icon from `@qeetrix/icons`: sharp, `--qx-size-icon-2xs` (12px), decorative. */
  icon?: IconSource;
}

/**
 * A short, static status or count: one or two words. It truncates with an ellipsis; pass `title`
 * with the full text where it may be cut. Server-safe.
 */
export function Badge({
  tone = "neutral",
  variant = "subtle",
  size = "md",
  icon: Icon,
  className,
  children,
  ...props
}: BadgeProps): ReactElement {
  return (
    <span
      {...props}
      className={cx("qx-badge", className)}
      data-slot="badge"
      data-tone={tone}
      data-variant={variant}
      data-size={size}
    >
      {Icon &&
        // The width and height attributes before CSS loads; --qx-size-icon-2xs sizes it after.
        drawIcon(Icon, { size: 12, className: "qx-badge-icon", "data-slot": "badge-icon" })}
      <span className="qx-badge-label" data-slot="badge-label">
        {children}
      </span>
    </span>
  );
}
