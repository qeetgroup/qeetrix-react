import { type ComponentProps, type ReactElement, type ReactNode, useId } from "react";
import { Heading, type HeadingLevel } from "../heading/heading";
import { cx } from "../internal/cx";
import { type RenderProp, renderElement } from "../internal/render";

/** A titled card names its heading level, so the page sets the outline, not the look. */
type CardTitle =
  | { title: ReactNode; level: HeadingLevel }
  | { title?: undefined; level?: undefined };

interface CardOwnProps extends Omit<ComponentProps<"div">, "title"> {
  /** A line under the title. */
  description?: ReactNode;
  /** Actions at the end of the header, e.g. a ghost "View all" button. */
  actions?: ReactNode;
  /** A ruled footer, e.g. the card's actions. */
  footer?: ReactNode;
  /** Render a different element, e.g. `render={<article />}`. */
  render?: RenderProp;
}

/** Card props: a `title` needs its heading `level`. The children are the body. */
export type CardProps = CardOwnProps & CardTitle;

/**
 * Related content on a page (06-component-specs.md §9): a raised, ruled surface with no shadow. A
 * titled card is a section labelled by its title. A Table as the body's direct child runs edge to
 * edge. Server-safe.
 */
export function Card({
  title,
  level,
  description,
  actions,
  footer,
  render,
  className,
  children,
  ...props
}: CardProps): ReactElement {
  const titleId = useId();
  const titled = title != null && level !== undefined;
  const header = titled || description != null || actions != null;
  return renderElement(titled ? "section" : "div", render, {
    ...(titled ? { "aria-labelledby": titleId } : {}),
    ...props,
    className: cx("qx-card", className),
    "data-slot": "card",
    children: (
      <>
        {header && (
          <div className="qx-card-header" data-slot="card-header">
            <div className="qx-card-heading">
              {titled && (
                <Heading level={level} size="title-sm" id={titleId}>
                  {title}
                </Heading>
              )}
              {description != null && (
                <p className="qx-card-description" data-slot="card-description">
                  {description}
                </p>
              )}
            </div>
            {actions != null && (
              <div className="qx-card-actions" data-slot="card-actions">
                {actions}
              </div>
            )}
          </div>
        )}
        <div className="qx-card-body" data-slot="card-body">
          {children}
        </div>
        {footer != null && (
          <div className="qx-card-footer" data-slot="card-footer">
            {footer}
          </div>
        )}
      </>
    ),
  });
}
