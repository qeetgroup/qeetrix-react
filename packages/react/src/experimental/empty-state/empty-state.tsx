import type { ComponentProps, ReactElement, ReactNode } from "react";
import { Heading, type HeadingLevel } from "../../heading/heading";
import type { QeetrixIcon } from "../../internal/control";
import { cx } from "../../internal/cx";

export type EmptyStateSize = "page" | "section";
export type EmptyStateTone = "neutral" | "danger";

export interface EmptyStateProps extends Omit<ComponentProps<"div">, "title"> {
  /** A 24px sharp icon from `@qeetrix/icons`. */
  icon?: QeetrixIcon;
  /** What's missing or what went wrong, in a few words: "No users yet". */
  title: ReactNode;
  /** One or two sentences: why, and what to do. */
  description?: ReactNode;
  /** Buttons, one primary at most. */
  actions?: ReactNode;
  /**
   * Under the actions, in small subtle text: a link to the docs, or a second way in ("Or import
   * users from a CSV file").
   */
  children?: ReactNode;
  /** `page` for a whole view; `section` inside a card or table. Default `page`. */
  size?: EmptyStateSize;
  /** `danger` colours the icon for an error. Default `neutral`. */
  tone?: EmptyStateTone;
  /**
   * Make the title a heading at this level, when this is the page's main message. Without it, the
   * title is styled text. Default `undefined`.
   */
  level?: HeadingLevel;
}

/**
 * The message where content would be: nothing yet, no results, or an error. Centred, at most 480px
 * wide; anything in `children` goes under the actions. Server-safe.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  size = "page",
  tone = "neutral",
  level,
  className,
  children,
  ...props
}: EmptyStateProps): ReactElement {
  return (
    <div
      {...props}
      className={cx("qx-empty-state", className)}
      data-slot="empty-state"
      data-size={size}
      data-tone={tone}
    >
      {Icon && (
        <Icon
          shape="sharp"
          size={24}
          aria-hidden
          className="qx-empty-state-icon"
          data-slot="empty-state-icon"
        />
      )}
      {level !== undefined ? (
        <Heading level={level} size={size === "page" ? "title-md" : "title-sm"} align="center">
          {title}
        </Heading>
      ) : (
        <p className="qx-empty-state-title" data-slot="empty-state-title">
          {title}
        </p>
      )}
      {description != null && (
        <p className="qx-empty-state-description" data-slot="empty-state-description">
          {description}
        </p>
      )}
      {actions != null && (
        <div className="qx-empty-state-actions" data-slot="empty-state-actions">
          {actions}
        </div>
      )}
      {children != null && typeof children !== "boolean" && (
        <div className="qx-empty-state-footer" data-slot="empty-state-footer">
          {children}
        </div>
      )}
    </div>
  );
}
