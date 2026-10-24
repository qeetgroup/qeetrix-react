import type { ComponentProps, ReactElement } from "react";
import { cx } from "../internal/cx";
import { type RenderProp, renderElement } from "../internal/render";
import type { TextAlign } from "../internal/space";
import { type TextTone, type Truncate, truncation } from "../internal/text";

export type TextSize = "sm" | "md" | "lg";
export type TextWeight = "regular" | "medium" | "semibold";

export interface TextProps extends ComponentProps<"span"> {
  /** The body role: `sm` 12/16, `md` 14/20 (default), `lg` 16/24. */
  size?: TextSize;
  /** `regular` 400 (default), `medium` 500, `semibold` 600. */
  weight?: TextWeight;
  /** A text colour from the tokens; unset inherits. */
  tone?: TextTone;
  /** Fira Code at the same size, for code, IDs and keys. */
  mono?: boolean;
  /** `true` for one line with an ellipsis, or a number of lines. */
  truncate?: Truncate;
  /** Logical alignment. */
  align?: TextAlign;
  /** Render a different element, e.g. `<p />`. Default `<span>`. */
  render?: RenderProp;
}

/** Running text, labels and inline code, on the token type roles. */
export function Text({
  size,
  weight,
  tone,
  mono,
  truncate,
  align,
  render,
  className,
  style,
  ...props
}: TextProps): ReactElement {
  const clamp = truncation(truncate);
  return renderElement("span", render, {
    ...props,
    className: cx("qx-text", className),
    style: clamp.style || style ? { ...clamp.style, ...style } : undefined,
    "data-slot": "text",
    "data-size": size,
    "data-weight": weight,
    "data-tone": tone,
    "data-mono": mono ? "" : undefined,
    "data-truncate": clamp.attribute,
    "data-align": align,
  });
}
