import { ChevronRightIcon } from "@qeetrix/icons/icons/chevron-right";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cx } from "../../internal/cx";
import { messages } from "../../internal/messages";
import { type RenderProp, renderElement } from "../../internal/render";

export interface BreadcrumbProps extends ComponentProps<"nav"> {
  /**
   * Names the navigation landmark. Breadcrumb is server-safe, so QeetrixProvider's strings don't
   * reach it: pass a translation here. An `aria-label` or `aria-labelledby` overrides it. Default
   * `Breadcrumb`.
   */
  label?: string;
  /** BreadcrumbItems, the current page last. */
  children?: ReactNode;
}

export interface BreadcrumbItemProps extends Omit<ComponentProps<"li">, "children"> {
  /** Where it goes. The current item takes none. */
  href?: string;
  /** A router link instead of `<a>`, e.g. `render={<Link to="/users" />}`. */
  render?: RenderProp;
  /** The current page: plain text with `aria-current="page"`. */
  current?: boolean;
  /** The page's name. A long one truncates at 240px; as plain text, it's kept whole as a title. */
  children: ReactNode;
}

/**
 * Where the page sits, in a console header: an ordered list of links, separated by sharp chevrons
 * that mirror in right-to-left text. Server-safe.
 */
export function Breadcrumb({
  label = messages.breadcrumb.label,
  className,
  children,
  ...props
}: BreadcrumbProps): ReactElement {
  return (
    <nav
      aria-label={label}
      {...props}
      className={cx("qx-breadcrumb", className)}
      data-slot="breadcrumb"
    >
      <ol className="qx-breadcrumb-list">{children}</ol>
    </nav>
  );
}

/** One step. A long label truncates and keeps its full text as a title. */
export function BreadcrumbItem({
  href,
  render,
  current,
  className,
  children,
  ...props
}: BreadcrumbItemProps): ReactElement {
  const title = typeof children === "string" ? children : undefined;
  return (
    <li {...props} className={cx("qx-breadcrumb-item", className)} data-slot="breadcrumb-item">
      <ChevronRightIcon shape="sharp" size={12} aria-hidden className="qx-breadcrumb-separator" />
      {current ? (
        <span className="qx-breadcrumb-current" aria-current="page" title={title}>
          {children}
        </span>
      ) : (
        renderElement("a", render, { href, className: "qx-breadcrumb-link", title, children })
      )}
    </li>
  );
}
