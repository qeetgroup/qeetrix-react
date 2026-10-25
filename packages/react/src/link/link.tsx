import { ArrowUpRightIcon } from "@qeetrix/icons/icons/arrow-up-right";
import type { ComponentProps, ReactElement } from "react";
import { cx } from "../internal/cx";
import { messages } from "../internal/messages";
import { type RenderProp, renderElement } from "../internal/render";
import { VisuallyHidden } from "../visually-hidden/visually-hidden";

export type LinkTone = "default" | "subtle" | "inherit";

export interface LinkProps extends ComponentProps<"a"> {
  /** `default` (link colour), `subtle` (footers, metadata) or `inherit`. */
  tone?: LinkTone;
  /** Opens in a new tab: adds `rel="noopener noreferrer"`, an arrow and "(opens in a new tab)". */
  external?: boolean;
  /** Render a router link, e.g. `render={<RouterLink to="/x" />}`. */
  render?: RenderProp;
}

/** Navigation to a page, a section, a file or a site. An action that changes data is a Button. */
export function Link({
  tone,
  external,
  render,
  rel,
  className,
  children,
  ...props
}: LinkProps): ReactElement {
  return renderElement("a", render, {
    ...(external ? { target: "_blank" } : {}),
    ...props,
    rel: external ? cx(rel, "noopener noreferrer") : rel,
    className: cx("qx-link", className),
    "data-slot": "link",
    "data-tone": tone,
    "data-external": external ? "" : undefined,
    children: external ? (
      <>
        {children}
        <ArrowUpRightIcon
          shape="sharp"
          size={12}
          aria-hidden
          className="qx-link-icon"
          data-slot="link-icon"
        />
        <VisuallyHidden> {messages.link.external}</VisuallyHidden>
      </>
    ) : (
      children
    ),
  });
}
