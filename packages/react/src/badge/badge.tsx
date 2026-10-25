import type { ComponentProps, ReactElement } from "react";
import type { QeetrixIcon } from "../internal/control";
import { cx } from "../internal/cx";

export type BadgeTone = "neutral" | "brand" | "info" | "success" | "warning" | "danger";

export interface BadgeProps extends ComponentProps<"span"> {
  /** Default `neutral`. The word carries the meaning; the tone only reinforces it. */
  tone?: BadgeTone;
  /** A leading icon from `@qeetrix/icons`: sharp, 12px, decorative. */
  icon?: QeetrixIcon;
}

/**
 * A short, static status or count: one or two words (06-component-specs.md §10). It truncates with
 * an ellipsis; pass `title` with the full text where it may be cut. Server-safe.
 */
export function Badge({
  tone = "neutral",
  icon: Icon,
  className,
  children,
  ...props
}: BadgeProps): ReactElement {
  return (
    <span {...props} className={cx("qx-badge", className)} data-slot="badge" data-tone={tone}>
      {Icon && <Icon shape="sharp" size={12} aria-hidden className="qx-badge-icon" />}
      <span className="qx-badge-label">{children}</span>
    </span>
  );
}
