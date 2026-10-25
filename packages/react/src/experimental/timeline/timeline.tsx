import type { ComponentProps, ReactElement, ReactNode } from "react";
import type { QeetrixIcon } from "../../internal/control";
import { cx } from "../../internal/cx";

export type TimelineVariant = "default" | "compact";
export type TimelineTone = "neutral" | "danger" | "success" | "warning";

export interface TimelineProps extends ComponentProps<"ol"> {
  /** `default`: an icon per event, a line between them. `compact`: a dot, for a side panel. */
  variant?: TimelineVariant;
}

export interface TimelineGroupProps extends Omit<ComponentProps<"li">, "title"> {
  /** The group's heading, such as the day: "Today". */
  label: ReactNode;
}

export interface TimelineItemProps extends Omit<ComponentProps<"li">, "title"> {
  /** What happened: "Signed in with a passkey". */
  title: ReactNode;
  /** Where, by whom, or how: "Bengaluru, India · Chrome on macOS". */
  description?: ReactNode;
  /** When, as shown: "2 min ago". */
  time?: ReactNode;
  /** When, as a machine-readable date, so `time` is a `<time>` element. */
  dateTime?: string;
  /** A 16px icon for the kind of event. */
  icon?: QeetrixIcon;
  /** `danger` for a failure, such as a refused sign-in. Default `neutral`. */
  tone?: TimelineTone;
}

/**
 * What happened, newest first (07-components.md): a user's recent activity, a payment's history, a
 * delivery's attempts. An ordered list of events, optionally grouped by day; each event shows its
 * icon, what happened, where or by whom, and when, joined by a line. Failures take the danger
 * colour. The full audit log stays a Table; this is the short summary on a detail page.
 * Server-safe.
 */
export function Timeline({
  variant = "default",
  className,
  ...props
}: TimelineProps): ReactElement {
  return (
    <ol
      {...props}
      className={cx("qx-timeline", className)}
      data-slot="timeline"
      data-variant={variant}
    />
  );
}

/** A heading and the events under it, such as one day's. */
export function TimelineGroup({
  label,
  children,
  className,
  ...props
}: TimelineGroupProps): ReactElement {
  return (
    <li {...props} className={cx("qx-timeline-group", className)} data-slot="timeline-group">
      <span className="qx-timeline-group-label">{label}</span>
      <ol className="qx-timeline-events">{children}</ol>
    </li>
  );
}

/** One event. */
export function TimelineItem({
  title,
  description,
  time,
  dateTime,
  icon: Icon,
  tone = "neutral",
  className,
  ...props
}: TimelineItemProps): ReactElement {
  return (
    <li
      {...props}
      className={cx("qx-timeline-item", className)}
      data-slot="timeline-item"
      data-tone={tone}
    >
      <span className="qx-timeline-marker" aria-hidden>
        {Icon && <Icon shape="sharp" size={16} />}
      </span>
      <span className="qx-timeline-body">
        <span className="qx-timeline-title">{title}</span>
        {description != null && <span className="qx-timeline-description">{description}</span>}
      </span>
      {time != null &&
        (dateTime ? (
          <time dateTime={dateTime} className="qx-timeline-time">
            {time}
          </time>
        ) : (
          <span className="qx-timeline-time">{time}</span>
        ))}
    </li>
  );
}
