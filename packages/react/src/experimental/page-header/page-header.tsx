import type { ComponentProps, ReactElement, ReactNode } from "react";
import { formatNumber } from "../../format/format";
import { Heading } from "../../heading/heading";
import { cx } from "../../internal/cx";

export interface PageHeaderProps extends Omit<ComponentProps<"div">, "title"> {
  /** Where the page sits: a Breadcrumb. */
  breadcrumb?: ReactNode;
  /** The page title: the page's one `<h1>`. */
  title: ReactNode;
  /** A number beside the title, e.g. the table's total; numbers are formatted in `en-IN`. */
  count?: ReactNode;
  /** A Badge beside the title. */
  status?: ReactNode;
  /** One line under the title. */
  description?: ReactNode;
  /** Buttons at the end: the primary last; at most one solid and one soft, the rest in a menu. */
  actions?: ReactNode;
  /** A TabsList, attached to the header's foot. */
  tabs?: ReactNode;
}

export type PageContentWidth = "full" | "narrow";

export interface PageContentProps extends ComponentProps<"div"> {
  /** `full` (default) for tables and dashboards; `narrow` (800px) for forms and settings. */
  width?: PageContentWidth;
}

/**
 * The head of a console page (07-components.md, C1): breadcrumb, title with its count and status,
 * actions, and tabs, on a ruled band above the work surface. Server-safe.
 */
export function PageHeader({
  breadcrumb,
  title,
  count,
  status,
  description,
  actions,
  tabs,
  className,
  ...props
}: PageHeaderProps): ReactElement {
  return (
    <div
      {...props}
      className={cx("qx-page-header", className)}
      data-slot="page-header"
      data-tabs={tabs != null ? "" : undefined}
    >
      {breadcrumb != null && <div className="qx-page-header-breadcrumb">{breadcrumb}</div>}
      <div className="qx-page-header-row">
        <div className="qx-page-header-titles">
          <div className="qx-page-header-title">
            <Heading level={1} size="heading-sm">
              {title}
            </Heading>
            {count != null && (
              <span className="qx-page-header-count" data-slot="page-header-count">
                {typeof count === "number" ? formatNumber(count) : count}
              </span>
            )}
            {status}
          </div>
          {description != null && (
            <p className="qx-page-header-description" data-slot="page-header-description">
              {description}
            </p>
          )}
        </div>
        {actions != null && (
          <div className="qx-page-header-actions" data-slot="page-header-actions">
            {actions}
          </div>
        )}
      </div>
      {tabs != null && <div className="qx-page-header-tabs">{tabs}</div>}
    </div>
  );
}

/** The work surface under a PageHeader. Server-safe. */
export function PageContent({
  width = "full",
  className,
  ...props
}: PageContentProps): ReactElement {
  return (
    <div
      {...props}
      className={cx("qx-page-content", className)}
      data-slot="page-content"
      data-width={width}
    />
  );
}
