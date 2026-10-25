"use client";

import { CheckIcon } from "@qeetrix/icons/icons/check";
import { CircleAlertIcon } from "@qeetrix/icons/icons/circle-alert";
import { CopyIcon } from "@qeetrix/icons/icons/copy";
import { type ReactElement, type ReactNode, useEffect, useRef, useState } from "react";
import { Button, IconButton, type IconButtonProps } from "../../button/button";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { useMessages } from "../../provider/provider";
import { VisuallyHidden } from "../../visually-hidden/visually-hidden";

/** Where a copy stands: ready, just copied, or failed (no clipboard access). */
export type CopyButtonState = "idle" | "copied" | "failed";

export interface CopyButtonProps
  extends Omit<
    IconButtonProps,
    "icon" | "aria-label" | "tooltip" | "loading" | "onClick" | "onCopy" | "value"
  > {
  /** The text to copy, or a function that returns it (it may be async, e.g. a fresh token). */
  value: string | (() => string | Promise<string>);
  /** What it copies, as the button's name and tooltip: "Copy user ID". Default "Copy". */
  label?: string;
  /** A visible label makes it a Button (label first, icon last) instead of an IconButton. */
  children?: ReactNode;
  /** Called with the text once it's on the clipboard. */
  onCopied?: (value: string) => void;
  /** Called when copying fails, e.g. no clipboard access outside a secure context. */
  onCopyError?: (error: unknown) => void;
  /** How long "Copied" (or the failure) shows before it resets, in milliseconds. Default 2000. */
  resetAfter?: number;
  /** This button's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["copyButton"]>;
}

/**
 * Copies text to the clipboard (07-components.md, C2). Focus stays on the button; the icon turns
 * into a check, and "Copied" is announced politely, then it resets. It fails visibly, never
 * silently, where the page has no clipboard access.
 */
export function CopyButton({
  value,
  label,
  children,
  onCopied,
  onCopyError,
  resetAfter = 2000,
  messages,
  variant = "ghost",
  tone = "neutral",
  className,
  ...props
}: CopyButtonProps): ReactElement {
  const strings = useMessages("copyButton", messages);
  const [state, setState] = useState<CopyButtonState>("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    window.clearTimeout(timer.current);
    // Back to idle first, so a second copy is announced again.
    setState("idle");
    try {
      const text = typeof value === "function" ? await value() : value;
      if (!navigator.clipboard?.writeText) throw new Error("The clipboard isn't available here.");
      await navigator.clipboard.writeText(text);
      setState("copied");
      onCopied?.(text);
    } catch (error) {
      setState("failed");
      onCopyError?.(error);
    }
    timer.current = window.setTimeout(() => setState("idle"), resetAfter);
  };

  const Icon = state === "copied" ? CheckIcon : state === "failed" ? CircleAlertIcon : CopyIcon;
  const announcement =
    state === "copied" ? strings.copied : state === "failed" ? strings.failed : "";
  const name = label ?? strings.copy;
  const shared = {
    ...props,
    variant,
    tone,
    icon: Icon,
    className: cx("qx-copy-button", className),
    "data-state": state,
    onClick: copy,
  };

  return (
    <>
      {children != null ? (
        <Button {...shared}>{children}</Button>
      ) : (
        <IconButton {...shared} aria-label={name} tooltip={announcement || name} />
      )}
      <VisuallyHidden role="status">{announcement}</VisuallyHidden>
    </>
  );
}
