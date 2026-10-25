"use client";

import { ArrowLeftIcon } from "@qeetrix/icons/icons/arrow-left";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { type RenderProp, renderElement } from "../../internal/render";
import { fill } from "../../internal/template";
import { useMessages } from "../../provider/provider";

export interface PageHeaderBackProps extends ComponentProps<"a"> {
  /** Where it goes: the parent page. */
  href?: string;
  /** A router link instead of `<a>`, e.g. `render={<RouterLink to="/users" />}`. */
  render?: RenderProp;
  /**
   * The parent page's name, after the arrow: "Users". As plain text, the link is named "Back to
   * Users" for screen readers. Default `Back`.
   */
  children?: ReactNode;
  /** This link's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["pageHeader"]>;
}

/**
 * A link back to the parent page, above a PageHeader's title: an arrow that points the reading way,
 * then the parent's name. For a detail page one level down, where a breadcrumb would repeat it.
 */
export function PageHeaderBack({
  render,
  messages,
  className,
  children,
  ...props
}: PageHeaderBackProps): ReactElement {
  const strings = useMessages("pageHeader", messages);
  return renderElement("a", render, {
    "aria-label":
      typeof children === "string" ? fill(strings.backTo, { page: children }) : undefined,
    ...props,
    className: cx("qx-page-header-back", className),
    "data-slot": "page-header-back",
    children: (
      <>
        <ArrowLeftIcon shape="sharp" size={16} aria-hidden className="qx-page-header-back-icon" />
        <span className="qx-page-header-back-label">{children ?? strings.back}</span>
      </>
    ),
  });
}
