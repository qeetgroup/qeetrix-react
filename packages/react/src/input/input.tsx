"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { Input as BaseInput } from "@base-ui/react/input";
import type { ComponentProps, CSSProperties, ReactElement, ReactNode } from "react";
import { cx } from "../internal/cx";
import { drawIcon, type IconSource } from "../internal/icon";

/** A field's size: `md`, the one height every form shares, or `lg`, for a step that asks for one value. */
export type InputSize = "md" | "lg";

export interface InputProps
  extends Omit<BaseInput.Props, "className" | "style" | "render" | "size"> {
  /** A leading icon from `@qeetrix/icons` (search, mail): sharp, 16px, decorative. */
  icon?: IconSource;
  /** Before the value: a text affix such as ₹. */
  startAdornment?: ReactNode;
  /** After the value: an affix such as % or .qeet.in, or a tool such as a show-password button. */
  endAdornment?: ReactNode;
  /**
   * `md` (default): the height every field in a form shares. `lg`: the one value a sign-in or sign-up
   * step asks for (a phone number, a name), as OTPInput's `lg`: `size.control.lg` + 16px tall, the
   * value and any affix at `title.lg` with tabular figures, the placeholder at body size. Use it for
   * that step's one field only.
   */
  size?: InputSize;
  /** Placement of the box only (margin, width, grid placement). */
  className?: string;
  /** Placement of the box only, like `className`. */
  style?: CSSProperties;
}

/**
 * The single-line text control: a filled box with a bottom line. `ref` and every other prop go to
 * the `<input>`; `className` and `style` place the box.
 */
export function Input({
  icon: Icon,
  startAdornment,
  endAdornment,
  size = "md",
  className,
  style,
  ...props
}: InputProps): ReactElement {
  return (
    <div className={cx("qx-input", className)} style={style} data-slot="input" data-size={size}>
      {Icon && drawIcon(Icon, { size: 16, className: "qx-input-icon", "data-slot": "input-icon" })}
      {startAdornment != null && (
        <span className="qx-input-adornment" data-slot="input-start">
          {startAdornment}
        </span>
      )}
      <BaseInput {...props} className="qx-input-control" data-slot="input-control" />
      {endAdornment != null && (
        <span className="qx-input-adornment" data-slot="input-end">
          {endAdornment}
        </span>
      )}
    </div>
  );
}

export interface TextareaProps
  extends Omit<ComponentProps<"textarea">, "defaultValue" | "value" | "rows" | "children"> {
  /** Controlled value. */
  value?: string;
  /** Initial value when uncontrolled. */
  defaultValue?: string;
  /** Called with the new value and Base UI's event details. */
  onValueChange?: BaseInput.Props["onValueChange"];
  /** The height before it grows, in lines. Default `3`. */
  rows?: number;
  /** The most lines it grows to; after that it scrolls. Default: no limit. */
  maxRows?: number;
}

/**
 * Multi-line text with the Input look. It grows with its content where the browser supports CSS
 * `field-sizing`; elsewhere it keeps `rows` and can be dragged taller. No script measures it.
 */
export function Textarea({
  rows = 3,
  maxRows,
  className,
  style,
  ...props
}: TextareaProps): ReactElement {
  const lines = {
    "--qx-textarea-rows": rows,
    ...(maxRows === undefined ? {} : { "--qx-textarea-max-rows": maxRows }),
  } as CSSProperties;
  return (
    <BaseField.Control
      {...(props as BaseField.Control.Props)}
      render={<textarea rows={rows} />}
      className={cx("qx-input qx-textarea", className)}
      style={{ ...lines, ...style }}
      data-slot="textarea"
      data-max-rows={maxRows === undefined ? undefined : ""}
    />
  );
}
