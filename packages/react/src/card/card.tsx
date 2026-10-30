import { Children, type ComponentProps, type ReactElement, type ReactNode, useId } from "react";
import { Heading, type HeadingLevel } from "../heading/heading";
import { cx } from "../internal/cx";
import { type RenderProp, renderElement } from "../internal/render";

/** A titled card names its heading level, so the page sets the outline, not the look. */
type CardTitle =
  | {
      /**
       * The title, in the ruled header (`title.sm`). A titled card is a `section` named by it.
       * Needs `level`.
       */
      title: ReactNode;
      /** The title's heading level, `1`–`6`: set by the page's outline, not the look. */
      level: HeadingLevel;
    }
  | {
      /**
       * The title, in the ruled header (`title.sm`). A titled card is a `section` named by it.
       * Needs `level`.
       */
      title?: undefined;
      /** The title's heading level, `1`–`6`: set by the page's outline, not the look. */
      level?: undefined;
    };

/** The surface: `default` is raised, `subdued` the sunken tone for secondary panels. */
export type CardVariant = "default" | "subdued";

/** `danger` marks a "danger zone": settings that delete or can't be undone. */
export type CardTone = "neutral" | "danger";

interface CardOwnProps extends Omit<ComponentProps<"div">, "title"> {
  /** A line under the title. */
  description?: ReactNode;
  /** Actions at the end of the header, e.g. a ghost "View all" button. */
  actions?: ReactNode;
  /** A ruled footer, e.g. the card's actions. */
  footer?: ReactNode;
  /**
   * The surface. `subdued` is the sunken tone, for a secondary panel beside or below the main
   * content: still ruled, still without a shadow. Default `default`.
   */
  variant?: CardVariant;
  /**
   * `danger` draws the border and the title in the danger colour, for a "danger zone" of settings
   * that delete or can't be undone. The title still says what it is: colour never stands alone.
   * Default `neutral`.
   */
  tone?: CardTone;
  /** Render a different element, e.g. `render={<article />}`. */
  render?: RenderProp;
}

/** Card props: a `title` needs its heading `level`. The children are the body. */
export type CardProps = CardOwnProps & CardTitle;

/**
 * Related content on a page: a raised, ruled surface with no shadow. A titled card is a section
 * labelled by its title. A Table as the body's direct child runs edge to edge. Server-safe.
 */
export function Card({
  title,
  level,
  description,
  actions,
  footer,
  variant,
  tone,
  render,
  className,
  children,
  ...props
}: CardProps): ReactElement {
  const titleId = useId();
  const titled = title != null && level !== undefined;
  const header = titled || description != null || actions != null;
  // No body without content (QTRX-174): a header-only card (a title and its actions) ends at the
  // header, not 32px of empty padding. `null`, `false` and `""` children are no content.
  const body = Children.toArray(children).some((child) => child !== "");
  return renderElement(titled ? "section" : "div", render, {
    ...(titled ? { "aria-labelledby": titleId } : {}),
    ...props,
    className: cx("qx-card", className),
    "data-slot": "card",
    "data-variant": variant === "subdued" ? variant : undefined,
    "data-tone": tone === "danger" ? tone : undefined,
    children: (
      <>
        {header && (
          <div className="qx-card-header" data-slot="card-header">
            <div className="qx-card-heading" data-slot="card-heading">
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
        {body && (
          <div className="qx-card-body" data-slot="card-body">
            {children}
          </div>
        )}
        {footer != null && (
          <div className="qx-card-footer" data-slot="card-footer">
            {footer}
          </div>
        )}
      </>
    ),
  });
}
