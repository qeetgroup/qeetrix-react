import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cx } from "../internal/cx";
import type { QeetrixMessages } from "../internal/messages";
import { ProvidedMessage } from "../internal/provided";
import { type RenderProp, renderElement } from "../internal/render";

export interface SkipLinkProps extends ComponentProps<"a"> {
  /** Where the link jumps to. Default `#main`. */
  href?: string;
  /**
   * The label. Without it, the `label` string: this link's `messages`, then QeetrixProvider's.
   * Default `Skip to main content`.
   */
  children?: ReactNode;
  /** Render a different element, e.g. a router link. */
  render?: RenderProp;
  /** This link's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["skipLink"]>;
}

/**
 * The first focusable element on a page: it jumps past the navigation to the main content
 * (WCAG 2.4.1 Bypass Blocks). Hidden until focused. Server-safe: its label comes from
 * QeetrixProvider through a client leaf, so the link itself carries no client code.
 */
export function SkipLink({
  href = "#main",
  children,
  render,
  messages,
  className,
  ...props
}: SkipLinkProps): ReactElement {
  return renderElement("a", render, {
    ...props,
    href,
    children: children ?? <ProvidedMessage group="skipLink" name="label" own={messages} />,
    className: cx("qx-skip-link", className),
    "data-slot": "skip-link",
  });
}
