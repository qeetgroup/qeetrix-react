import type { ComponentProps, ReactElement, ReactNode } from "react";
import { Heading } from "../../heading/heading";
import { cx } from "../../internal/cx";
import { ProvidedNumber } from "../../internal/provided";

export interface PageHeaderProps extends Omit<ComponentProps<"div">, "title"> {
  /**
   * A link back to the parent page, above the title: a PageHeaderBack. For a page one level down;
   * use it instead of a breadcrumb there.
   */
  back?: ReactNode;
  /** Where the page sits: a Breadcrumb. */
  breadcrumb?: ReactNode;
  /**
   * A record's picture before its title and description, such as an organisation's logo or a
   * person's Avatar (`decorative`, since the title names them). It stays out of the heading.
   */
  leading?: ReactNode;
  /** The page title: the page's one `<h1>`. */
  title: ReactNode;
  /**
   * A number beside the title, e.g. the table's total. A number is formatted in QeetrixProvider's
   * locale (`en-IN` without one).
   */
  count?: ReactNode;
  /** A Badge beside the title. */
  status?: ReactNode;
  /** One line under the title. */
  description?: ReactNode;
  /** Buttons at the end: the primary last; at most one solid and one soft, the rest in a menu. */
  actions?: ReactNode;
  /**
   * Key numbers for the page: a StatGroup, ruled edge to edge under the title, its first and last
   * cells on the page gutter. A Stat's `chart` and `action` carry a small chart and a link into the
   * list, for a richer summary band.
   */
  summary?: ReactNode;
  /**
   * A TabsList, attached to the header's foot: the first label on the page gutter, its rule edge to
   * edge.
   */
  tabs?: ReactNode;
}

export type PageContentWidth = "full" | "narrow";

export interface PageContentProps extends ComponentProps<"div"> {
  /** `full` for tables and dashboards; `narrow` (800px) for forms and settings. Default `full`. */
  width?: PageContentWidth;
}

/**
 * The head of a console page (C1 · Ruled): a back link or breadcrumb, title with its count and
 * status, actions, an optional strip of key numbers, and tabs, on a ruled band above the work
 * surface. Server-safe: the count's locale comes from QeetrixProvider through a client leaf.
 */
export function PageHeader({
  back,
  breadcrumb,
  leading,
  title,
  count,
  status,
  description,
  actions,
  summary,
  tabs,
  className,
  ...props
}: PageHeaderProps): ReactElement {
  const titles = (
    <div className="qx-page-header-titles">
      <div className="qx-page-header-title">
        <Heading level={1} size="title-lg">
          {title}
        </Heading>
        {count != null && (
          <span className="qx-page-header-count" data-slot="page-header-count">
            {typeof count === "number" ? <ProvidedNumber value={count} /> : count}
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
  );
  return (
    <div
      {...props}
      className={cx("qx-page-header", className)}
      data-slot="page-header"
      data-foot={tabs != null ? "tabs" : summary != null ? "summary" : undefined}
    >
      {back != null && <div className="qx-page-header-back-row">{back}</div>}
      {breadcrumb != null && <div className="qx-page-header-breadcrumb">{breadcrumb}</div>}
      <div className="qx-page-header-row">
        {leading != null ? (
          <div className="qx-page-header-lead" data-slot="page-header-lead">
            <div className="qx-page-header-leading" data-slot="page-header-leading">
              {leading}
            </div>
            {titles}
          </div>
        ) : (
          titles
        )}
        {actions != null && (
          <div className="qx-page-header-actions" data-slot="page-header-actions">
            {actions}
          </div>
        )}
      </div>
      {summary != null && (
        <div className="qx-page-header-summary" data-slot="page-header-summary">
          {summary}
        </div>
      )}
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
