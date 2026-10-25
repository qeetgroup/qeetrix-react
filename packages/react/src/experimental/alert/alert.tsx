"use client";

import { CircleAlertIcon } from "@qeetrix/icons/icons/circle-alert";
import { CircleCheckIcon } from "@qeetrix/icons/icons/circle-check";
import { InfoIcon } from "@qeetrix/icons/icons/info";
import { TriangleAlertIcon } from "@qeetrix/icons/icons/triangle-alert";
import { XIcon } from "@qeetrix/icons/icons/x";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { IconButton } from "../../button/button";
import type { QeetrixIcon } from "../../internal/control";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { useMessages } from "../../provider/provider";
import { VisuallyHidden } from "../../visually-hidden/visually-hidden";

export type AlertTone = "info" | "success" | "warning" | "danger";

/** `default` sits in the page; `banner` spans it, under the top bar, in AppShell's `banners`. */
export type AlertVariant = "default" | "banner";

export interface AlertProps extends Omit<ComponentProps<"div">, "title"> {
  /**
   * The status. The icon and a hidden word ("Warning:") carry it, never colour alone.
   * Default `info`.
   */
  tone?: AlertTone;
  /**
   * `default`: in the page, with the status edge, the text over its actions. `banner`: a notice
   * about the whole app (maintenance, a trial ending, viewing as someone else), one line across the
   * page, its actions at the end; when it wraps, the icon and Dismiss stay on the first line.
   * Default `default`.
   */
  variant?: AlertVariant;
  /** In place of the tone's icon, from `@qeetrix/icons`: an eye for "viewing as". */
  icon?: QeetrixIcon;
  /** What happened, in a few words: "Directory sync failed". */
  title: ReactNode;
  /** One or two sentences: why, and what to do. */
  children?: ReactNode;
  /** Buttons or links under the text (a banner's at its end): one primary at most. */
  actions?: ReactNode;
  /** Adds a Dismiss button. The product decides whether the alert comes back. */
  onDismiss?: () => void;
  /**
   * Only for an alert that appears after something happens: `polite` (`role="status"`) waits its
   * turn; `urgent` (`role="alert"`) interrupts, for errors that block the task. An alert that is
   * there when the page loads needs neither.
   */
  announce?: "polite" | "urgent";
  /** This alert's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["alert"]>;
}

const ICONS: Record<AlertTone, QeetrixIcon> = {
  info: InfoIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
  danger: CircleAlertIcon,
};

/**
 * A message in the page: above a form, inside a card, or across the top of a console page in
 * AppShell's `notifications`. A tinted surface with the 3px status edge on its start side. It never
 * takes focus and never disappears by itself. As a `banner` it's a page banner: the tint edge to
 * edge with a rule in the tone under it, on the page's gutter.
 */
export function Alert({
  tone = "info",
  variant = "default",
  icon,
  title,
  children,
  actions,
  onDismiss,
  announce,
  messages,
  className,
  ...props
}: AlertProps): ReactElement {
  const strings = useMessages("alert", messages);
  const Icon = icon ?? ICONS[tone];
  return (
    <div
      {...props}
      role={announce === "urgent" ? "alert" : announce === "polite" ? "status" : undefined}
      className={cx("qx-alert", className)}
      data-slot="alert"
      data-tone={tone}
      data-variant={variant}
    >
      <Icon shape="sharp" size={16} aria-hidden className="qx-alert-icon" data-slot="alert-icon" />
      <div className="qx-alert-body" data-slot="alert-body">
        <div className="qx-alert-text" data-slot="alert-text">
          <div className="qx-alert-title" data-slot="alert-title">
            <VisuallyHidden>{`${strings[tone]}: `}</VisuallyHidden>
            {title}
          </div>{" "}
          {children != null && (
            <div className="qx-alert-description" data-slot="alert-description">
              {children}
            </div>
          )}
        </div>
        {actions != null && (
          <div className="qx-alert-actions" data-slot="alert-actions">
            {actions}
          </div>
        )}
      </div>
      {onDismiss && (
        <IconButton
          icon={XIcon}
          aria-label={strings.dismiss}
          size="sm"
          tone="neutral"
          tooltip={false}
          onClick={onDismiss}
          className="qx-alert-dismiss"
        />
      )}
    </div>
  );
}
