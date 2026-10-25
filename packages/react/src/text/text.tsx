import type { ComponentProps, ReactElement } from "react";
import { cx } from "../internal/cx";
import { type RenderProp, renderElement } from "../internal/render";
import type { TextAlign } from "../internal/space";
import { type TextTone, type Truncate, truncation } from "../internal/text";

export type TextSize = "sm" | "md" | "lg";
export type TextWeight = "regular" | "medium" | "semibold";

export interface TextProps extends ComponentProps<"span"> {
  /** The body role: `sm` 12/16, `md` 14/20 or `lg` 16/24. Default `md`. */
  size?: TextSize;
  /** `regular` 400, `medium` 500 or `semibold` 600. Default `regular`. */
  weight?: TextWeight;
  /**
   * A text colour from the tokens; unset inherits. `disabled` is only for text inside an inactive
   * control, one marked `disabled` or `aria-disabled="true"`: WCAG 1.4.3 exempts that text from
   * contrast, and the mark is how assistive technology and the accessibility checks know. Anywhere
   * else it's unreadable (2.48:1 in light) and fails AA; quieter text that must still be read is
   * `subtle`.
   */
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
