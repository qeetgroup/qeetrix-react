import type { ComponentProps, ReactElement } from "react";
import { cx } from "../internal/cx";
import { type RenderProp, renderElement } from "../internal/render";
import type { TextAlign } from "../internal/space";
import { type Truncate, truncation } from "../internal/text";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingSize =
  | "display-lg"
  | "display-md"
  | "display-sm"
  | "heading-lg"
  | "heading-md"
  | "heading-sm"
  | "title-lg"
  | "title-md"
  | "title-sm";
export type HeadingTone = "default" | "subtle" | "inverse";

export interface HeadingProps extends ComponentProps<"h2"> {
  /** The document level: renders `<h1>`…`<h6>`. Required, so the outline is always intended. */
  level: HeadingLevel;
  /** The look. Default by level: 1 heading-lg, 2 heading-md, 3 heading-sm, 4 title-lg, 5 title-md, 6 title-sm. */
  size?: HeadingSize;
  /** `default`, `subtle` or `inverse`. */
  tone?: HeadingTone;
  /** `true` for one line with an ellipsis, or a number of lines. */
  truncate?: Truncate;
  /** Logical alignment. */
  align?: TextAlign;
  /** Render a different element. Prefer `level`; use this for a link that looks like a heading. */
  render?: RenderProp;
}

const DEFAULT_SIZE: Record<HeadingLevel, HeadingSize> = {
  1: "heading-lg",
  2: "heading-md",
  3: "heading-sm",
  4: "title-lg",
  5: "title-md",
  6: "title-sm",
};

/** A section heading: the level sets the element, the size sets the look. */
export function Heading({
  level,
  size,
  tone,
  truncate,
  align,
  render,
  className,
  style,
  ...props
}: HeadingProps): ReactElement {
  const clamp = truncation(truncate);
  return renderElement(`h${level}`, render, {
    ...props,
    className: cx("qx-heading", className),
    style: clamp.style || style ? { ...clamp.style, ...style } : undefined,
    "data-slot": "heading",
    "data-size": size ?? DEFAULT_SIZE[level],
    "data-tone": tone,
    "data-truncate": clamp.attribute,
    "data-align": align,
  });
}
