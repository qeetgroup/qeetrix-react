import type { ComponentProps, ReactElement } from "react";
import { cx } from "../internal/cx";
import { type RenderProp, renderElement } from "../internal/render";

export type SeparatorOrientation = "horizontal" | "vertical";
export type SeparatorTone = "subtle" | "default" | "strong";

export interface SeparatorProps extends ComponentProps<"div"> {
  /** Default `horizontal`. A vertical separator stretches to its row. */
  orientation?: SeparatorOrientation;
  /** Line colour from the border tokens. Default `subtle`. */
  tone?: SeparatorTone;
  /** Purely visual: hidden from assistive technology (`role="none"`). */
  decorative?: boolean;
  /** Render a different element. */
  render?: RenderProp;
}

/** A 1px line between groups of content. */
export function Separator({
  orientation = "horizontal",
  tone,
  decorative,
  render,
  className,
  ...props
}: SeparatorProps): ReactElement {
  return renderElement("div", render, {
    role: decorative ? "none" : "separator",
    "aria-orientation": decorative || orientation === "horizontal" ? undefined : orientation,
    ...props,
    className: cx("qx-separator", className),
    "data-slot": "separator",
    "data-orientation": orientation,
    "data-tone": tone,
  });
}
