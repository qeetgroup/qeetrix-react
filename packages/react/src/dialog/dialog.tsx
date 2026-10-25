"use client";

import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { XIcon } from "@qeetrix/icons/icons/x";
import {
  type ComponentProps,
  type Context,
  type CSSProperties,
  createContext,
  type ReactElement,
  type ReactNode,
  use,
} from "react";
import { IconButton } from "../button/button";
import { cx } from "../internal/cx";
import type { QeetrixMessages } from "../internal/messages";
import { useMessages } from "../provider/provider";

/** The kind of decision: `standard`, or a `danger` / `warning` alert dialog. */
export type DialogIntent = "standard" | "danger" | "warning";
export type DialogSize = "sm" | "md" | "lg";

interface DialogState {
  intent: DialogIntent;
  dismissible: boolean;
}
/** The ways a user dismisses a dialog, as opposed to choosing one of its actions. */
const DISMISSALS = new Set(["escape-key", "outside-press", "focus-out"]);

const DialogContext: Context<DialogState> = createContext<DialogState>({
  intent: "standard",
  dismissible: true,
});

export interface DialogProps
  extends Omit<BaseDialog.Root.Props, "disablePointerDismissal" | "handle"> {
  /**
   * `danger` and `warning` render an alert dialog (`role="alertdialog"`) and its intent line in red
   * or amber. Default `standard` (Ember).
   */
  intent?: DialogIntent;
  /**
   * Whether Escape, an outside click and the close button can dismiss it. Default `true`, except
   * for `danger`, which only its actions close. Alert dialogs never close on an outside click.
   */
  dismissible?: boolean;
}

export type DialogTriggerProps = Omit<BaseDialog.Trigger.Props, "handle" | "payload">;
export type DialogCloseProps = BaseDialog.Close.Props;

export interface DialogContentProps
  extends Omit<BaseDialog.Popup.Props, "className" | "style" | "title" | "children"> {
  /** The title: the question or task ("Revoke this API key?"). It labels the dialog. */
  title: ReactNode;
  /** A line under the title; it describes the dialog. */
  description?: ReactNode;
  /** Width: `sm` 400, `md` 560 (default) or `lg` 800px. */
  size?: DialogSize;
  /** The close button's label, over QeetrixProvider's and the English default. */
  messages?: Partial<QeetrixMessages["overlay"]>;
  /** Placement only. */
  className?: string;
  style?: CSSProperties;
  /** DialogBody and DialogFooter. */
  children?: ReactNode;
}

export interface DialogBodyProps extends ComponentProps<"div"> {}
export interface DialogFooterProps extends ComponentProps<"div"> {}

/** Holds a dialog's open state: `open` / `defaultOpen` / `onOpenChange(open, details)`. */
export function Dialog({
  intent = "standard",
  dismissible = intent !== "danger",
  modal,
  onOpenChange,
  children,
  ...props
}: DialogProps): ReactElement {
  const handleOpenChange: DialogProps["onOpenChange"] = (open, details) => {
    if (!open && !dismissible && DISMISSALS.has(details.reason)) {
      details.cancel();
      return;
    }
    onOpenChange?.(open, details);
  };
  return (
    <DialogContext value={{ intent, dismissible }}>
      {intent === "standard" ? (
        <BaseDialog.Root
          {...props}
          modal={modal}
          disablePointerDismissal={!dismissible}
          onOpenChange={handleOpenChange}
        >
          {children}
        </BaseDialog.Root>
      ) : (
        <BaseAlertDialog.Root {...props} onOpenChange={handleOpenChange}>
          {children}
        </BaseAlertDialog.Root>
      )}
    </DialogContext>
  );
}

/** Opens the dialog. Render your own control: `render={<Button tone="danger">Revoke</Button>}`. */
export function DialogTrigger(props: DialogTriggerProps): ReactElement {
  const { intent } = use(DialogContext);
  return intent === "standard" ? (
    <BaseDialog.Trigger {...props} />
  ) : (
    <BaseAlertDialog.Trigger {...props} />
  );
}

/** Closes the dialog, e.g. Cancel: `render={<Button variant="ghost">Cancel</Button>}`. */
export function DialogClose(props: DialogCloseProps): ReactElement {
  return <BaseDialog.Close {...props} />;
}

/**
 * The dialog (06-component-specs.md §6): over a scrim, with the intent line, the header, then your
 * body and footer. The close button comes last in the DOM, so initial focus lands on the first field
 * or else the footer's first (least destructive) action.
 */
export function DialogContent({
  title,
  description,
  size = "md",
  messages,
  className,
  children,
  ...props
}: DialogContentProps): ReactElement {
  const { intent, dismissible } = use(DialogContext);
  const strings = useMessages("overlay", messages);
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="qx-dialog-backdrop" data-slot="dialog-backdrop" />
      <BaseDialog.Viewport className="qx-dialog-viewport">
        <BaseDialog.Popup
          {...props}
          className={cx("qx-dialog", className)}
          data-slot="dialog-popup"
          data-intent={intent}
          data-size={size}
          data-dismissible={dismissible ? "" : undefined}
        >
          <div className="qx-dialog-header" data-slot="dialog-header">
            <BaseDialog.Title className="qx-dialog-title" data-slot="dialog-title">
              {title}
            </BaseDialog.Title>
            {description != null && (
              <BaseDialog.Description
                className="qx-dialog-description"
                data-slot="dialog-description"
              >
                {description}
              </BaseDialog.Description>
            )}
          </div>
          {children}
          {dismissible && (
            <div className="qx-dialog-close" data-slot="dialog-close">
              <BaseDialog.Close
                render={<IconButton icon={XIcon} aria-label={strings.close} size="sm" />}
              />
            </div>
          )}
        </BaseDialog.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  );
}

/** The dialog's content; it scrolls when the dialog reaches its maximum height. */
export function DialogBody({ className, ...props }: DialogBodyProps): ReactElement {
  return <div {...props} className={cx("qx-dialog-body", className)} data-slot="dialog-body" />;
}

/** The actions, end-aligned: tertiary first, then the primary or destructive action. */
export function DialogFooter({ className, ...props }: DialogFooterProps): ReactElement {
  return <div {...props} className={cx("qx-dialog-footer", className)} data-slot="dialog-footer" />;
}
