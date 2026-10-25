import { ArrowUpRightIcon } from "@qeetrix/icons/icons/arrow-up-right";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cx } from "../internal/cx";
import { messages as defaults, type QeetrixMessages } from "../internal/messages";
import { type RenderProp, renderElement } from "../internal/render";
import { VisuallyHidden } from "../visually-hidden/visually-hidden";

export type LinkTone = "default" | "subtle" | "inherit";

export interface LinkProps extends ComponentProps<"a"> {
  /** `default` (link colour), `subtle` (footers, metadata) or `inherit`. Default `default`. */
  tone?: LinkTone;
  /**
   * Opens in a new tab: adds `rel="noopener noreferrer"`, an arrow at the end of the last line and
   * "(opens in a new tab)" for screen readers.
   */
  external?: boolean;
  /** Render a router link, e.g. `render={<RouterLink to="/x" />}`. */
  render?: RenderProp;
  /**
   * The screen-reader note on an external link, in place of "(opens in a new tab)". Link is
   * server-safe, so QeetrixProvider's strings don't reach it: pass them here.
   */
  messages?: Partial<QeetrixMessages["link"]>;
}

/**
 * Where the text's last word starts, or -1 when it has none. A scan, not `/\S+\s*$/`: that pattern
 * backtracks quadratically on a long run without spaces.
 */
function lastWordStart(text: string): number {
  let end = text.length;
  while (end > 0 && /\s/.test(text.charAt(end - 1))) end--;
  if (end === 0) return -1;
  let start = end;
  while (start > 0 && !/\s/.test(text.charAt(start - 1))) start--;
  return start;
}

/**
 * The text with the external arrow tied to its last word, so the arrow never wraps onto a line by
 * itself. Plain text is split before its last word; other content gets a word joiner instead.
 */
function withArrow(children: ReactNode): ReactNode {
  const arrow = (
    <ArrowUpRightIcon
      shape="sharp"
      size={12}
      aria-hidden
      className="qx-link-icon"
      data-slot="link-icon"
    />
  );
  const at = typeof children === "string" ? lastWordStart(children) : -1;
  if (typeof children === "string" && at >= 0) {
    return (
      <>
        {children.slice(0, at)}
        <span className="qx-link-tail">
          {children.slice(at)}
          {arrow}
        </span>
      </>
    );
  }
  return (
    <>
      {children}
      <span className="qx-link-tail" aria-hidden>
        {"\u2060"}
        {arrow}
      </span>
    </>
  );
}

/**
 * Navigation to a page, a section, a file or a site. An action that changes data is a Button. It's
 * inline, so a long link wraps with its sentence. Server-safe.
 */
export function Link({
  tone,
  external,
  render,
  rel,
  messages,
  className,
  children,
  ...props
}: LinkProps): ReactElement {
  const externalNote = messages?.external ?? defaults.link.external;
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
        {withArrow(children)}
        <VisuallyHidden> {externalNote}</VisuallyHidden>
      </>
    ) : (
      children
    ),
  });
}
