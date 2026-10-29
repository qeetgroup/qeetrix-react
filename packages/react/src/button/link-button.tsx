import type { ComponentProps, ReactElement, ReactNode } from "react";
import { type ControlSize, iconSize } from "../internal/control";
import { cx } from "../internal/cx";
import { drawIcon, type IconSource } from "../internal/icon";
import { type RenderProp, renderElement } from "../internal/render";
import type { ButtonTone, ButtonVariant } from "./button";

export interface LinkButtonProps extends Omit<ComponentProps<"a">, "children"> {
  /**
   * Emphasis, as Button's: `solid` (primary, Ember), `soft` (secondary, graphite), `ghost`
   * (tertiary). Default `solid`.
   */
  variant?: ButtonVariant;
  /** As Button's: `brand`, `danger` or `neutral`. Default `brand`. */
  tone?: ButtonTone;
  /** Height from the density tokens. Default `md`. */
  size?: ControlSize;
  /** The label. Say where it goes: "View invoices". */
  children?: ReactNode;
  /** A trailing icon from `@qeetrix/icons`; rendered in the sharp shape. */
  icon?: IconSource;
  /** Fill the width of the container (forms, mobile). */
  fullWidth?: boolean;
  /** Render a router link, e.g. `render={<RouterLink to="/users" />}`. */
  render?: RenderProp;
}

/**
 * Navigation that looks like a Button: a link (`<a href>`, or the router link given in `render`)
 * drawn with a button's variant, tone, size and trailing icon. It keeps a link's semantics: it's
 * announced as a link, Enter follows it, and it can be opened in a new tab. An action that changes
 * something is a Button. Server-safe.
 */
export function LinkButton({
  variant = "solid",
  tone = "brand",
  size = "md",
  icon: Icon,
  fullWidth,
  render,
  className,
  children,
  ...props
}: LinkButtonProps): ReactElement {
  return renderElement("a", render, {
    ...props,
    className: cx("qx-button", className),
    "data-slot": "link-button",
    "data-variant": variant,
    "data-tone": tone,
    "data-size": size,
    "data-icon": Icon ? "" : undefined,
    "data-full-width": fullWidth ? "" : undefined,
    children: (
      <>
        <span className="qx-button-label" data-slot="button-label">
          {children}
        </span>
        {Icon && (
          <span className="qx-button-zone" data-slot="button-zone">
            {drawIcon(Icon, {
              size: iconSize(size),
              className: "qx-button-icon",
              "data-slot": "button-icon",
            })}
          </span>
        )}
      </>
    ),
  });
}
