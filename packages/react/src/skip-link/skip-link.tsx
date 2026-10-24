import type { ComponentProps, ReactElement } from "react";
import { cx } from "../internal/cx";
import { messages } from "../internal/messages";
import { type RenderProp, renderElement } from "../internal/render";

export interface SkipLinkProps extends ComponentProps<"a"> {
  /** Where the link jumps to. Default `#main`. */
  href?: string;
  /** Render a different element, e.g. a router link. */
  render?: RenderProp;
}

/**
 * The first focusable element on a page: it jumps past the navigation to the main content
 * (WCAG 2.4.1 Bypass Blocks). Hidden until focused.
 */
export function SkipLink({
  href = "#main",
  children = messages.skipLink.label,
  render,
  className,
  ...props
}: SkipLinkProps): ReactElement {
  return renderElement("a", render, {
    ...props,
    href,
    children,
    className: cx("qx-skip-link", className),
    "data-slot": "skip-link",
  });
}
