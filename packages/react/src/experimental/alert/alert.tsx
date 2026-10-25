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

export interface AlertProps extends Omit<ComponentProps<"div">, "title"> {
  /** Default `info`. The icon and a hidden word ("Warning:") carry it, never colour alone. */
  tone?: AlertTone;
  /** What happened, in a few words: "Directory sync failed". */
  title: ReactNode;
  /** One or two sentences: why, and what to do. */
  children?: ReactNode;
  /** Buttons or links under the text: one primary at most. */
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
 * A message in the page (07-components.md, C2): above a form, inside a card, or across the top of
 * a console page in AppShell's `notifications`. A tinted surface with the 3px status edge on its
 * start side. It never takes focus and never disappears by itself.
 */
export function Alert({
  tone = "info",
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
  const Icon = ICONS[tone];
  return (
    <div
      {...props}
      role={announce === "urgent" ? "alert" : announce === "polite" ? "status" : undefined}
      className={cx("qx-alert", className)}
      data-slot="alert"
      data-tone={tone}
    >
      <Icon shape="sharp" size={16} aria-hidden className="qx-alert-icon" />
      <div className="qx-alert-body">
        <div className="qx-alert-title" data-slot="alert-title">
          <VisuallyHidden>{`${strings[tone]}: `}</VisuallyHidden>
          {title}
        </div>
        {children != null && (
          <div className="qx-alert-description" data-slot="alert-description">
            {children}
          </div>
        )}
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
