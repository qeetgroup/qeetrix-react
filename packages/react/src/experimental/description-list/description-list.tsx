"use client";

import type { ComponentProps, CSSProperties, ReactElement, ReactNode } from "react";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { useMessages } from "../../provider/provider";
import { VisuallyHidden } from "../../visually-hidden/visually-hidden";

export type DescriptionListLayout = "rows" | "columns";

export interface DescriptionListProps extends ComponentProps<"dl"> {
  /**
   * `rows`: each term beside its value, a line between rows; the term moves above the value where
   * the list is narrow. `columns`: the term above the value, in up to `columns` columns. Default
   * `rows`.
   */
  layout?: DescriptionListLayout;
  /** In `columns`: the most columns, fewer where there isn't room. Default `2`. */
  columns?: 1 | 2 | 3 | 4;
}

export interface DescriptionItemProps extends Omit<ComponentProps<"div">, "children"> {
  /** What the value is: "Email". */
  term: ReactNode;
  /** The value: text, a Badge, a link, a copy button. Empty shows "—", read as "Not set". */
  children?: ReactNode;
  /** This item's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["descriptionList"]>;
}

/**
 * Facts about one record, as term and value pairs: a user's email and ID, a payment's amount and
 * status. Semantic `dl`, `dt` and `dd`, so each pair is read together. Every product's detail pages
 * use it, so every detail page lines up the same way. In a Card, `rows` run edge to edge.
 */
export function DescriptionList({
  layout = "rows",
  columns = 2,
  className,
  style,
  ...props
}: DescriptionListProps): ReactElement {
  return (
    <dl
      {...props}
      className={cx("qx-description-list", className)}
      style={{ "--qx-description-columns": columns, ...style } as CSSProperties}
      data-slot="description-list"
      data-layout={layout}
    />
  );
}

/** One term and its value. */
export function DescriptionItem({
  term,
  children,
  messages,
  className,
  ...props
}: DescriptionItemProps): ReactElement {
  const strings = useMessages("descriptionList", messages);
  const empty = children == null || children === false || children === "";
  return (
    <div {...props} className={cx("qx-description-item", className)} data-slot="description-item">
      <dt className="qx-description-term" data-slot="description-term">
        {term}
      </dt>
      <dd className="qx-description-value" data-slot="description-value">
        {empty ? (
          <>
            <span aria-hidden className="qx-description-empty">
              —
            </span>
            <VisuallyHidden>{strings.empty}</VisuallyHidden>
          </>
        ) : (
          children
        )}
      </dd>
    </div>
  );
}
