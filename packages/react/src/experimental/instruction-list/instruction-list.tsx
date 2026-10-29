import type { ComponentProps, CSSProperties, ReactElement, ReactNode } from "react";
import { cx } from "../../internal/cx";

export type InstructionListOrientation = "vertical" | "horizontal";

export interface InstructionListProps extends Omit<ComponentProps<"ol">, "children"> {
  /**
   * `vertical`, numbered down a column (how to fix something); `horizontal`, a ruled strip of
   * steps joined by arrows (how something works: a sign-in through a directory). Default
   * `vertical`.
   */
  orientation?: InstructionListOrientation;
  /** The InstructionSteps, in order. */
  children?: ReactNode;
}

export interface InstructionStepProps
  extends Omit<ComponentProps<"li">, "children" | "title" | "value"> {
  /** The step's lead, in bold: "Check the address." */
  title: ReactNode;
  /** The sentence after it, which may hold inline code. */
  children?: ReactNode;
  /** A value the step uses, in code type: "ldaps://ldap.acme.in:636". */
  value?: ReactNode;
  /** A quieter line under it. */
  note?: ReactNode;
}

/**
 * Numbered steps that explain how something works or how to fix it: not progress (that's Steps),
 * so no step is done or current. An ordered list, so the numbers are read. Server-safe.
 */
export function InstructionList({
  orientation = "vertical",
  className,
  style,
  children,
  ...props
}: InstructionListProps): ReactElement {
  const count = Array.isArray(children) ? children.filter(Boolean).length : 1;
  return (
    <ol
      {...props}
      className={cx("qx-instruction-list", className)}
      style={{ "--qx-instruction-count": count, ...style } as CSSProperties}
      data-slot="instruction-list"
      data-orientation={orientation}
    >
      {children}
    </ol>
  );
}

/** One step: its lead and sentence, then an optional value and note. */
export function InstructionStep({
  title,
  value,
  note,
  className,
  children,
  ...props
}: InstructionStepProps): ReactElement {
  return (
    <li {...props} className={cx("qx-instruction-step", className)} data-slot="instruction-step">
      <span className="qx-instruction-step-text">
        <strong className="qx-instruction-step-title">{title}</strong>
        {children != null && <> {children}</>}
      </span>
      {value != null && (
        <span className="qx-instruction-step-value" data-slot="instruction-step-value">
          {value}
        </span>
      )}
      {note != null && (
        <span className="qx-instruction-step-note" data-slot="instruction-step-note">
          {note}
        </span>
      )}
    </li>
  );
}
