import type { ComponentProps, ReactElement } from "react";
import { cx } from "../internal/cx";
import { type RenderProp, renderElement } from "../internal/render";
import type { Space } from "../internal/space";
import type { FlowJustify } from "../stack/stack";

export type InlineAlign = "start" | "center" | "end" | "baseline" | "stretch";

export interface InlineProps extends ComponentProps<"div"> {
  /** Space between children, from the space scale. Default `sm` (8px). */
  gap?: Space;
  /** Cross-axis alignment. Default `center`. */
  align?: InlineAlign;
  /** Main-axis distribution. */
  justify?: FlowJustify;
  /** Wrap onto new lines when space runs out. Default `true`. */
  wrap?: boolean;
  /** Render a different element, e.g. `<ul />`. */
  render?: RenderProp;
}

/** A horizontal flow with token gaps that wraps by default. */
export function Inline({
  gap = "sm",
  align,
  justify,
  wrap = true,
  render,
  className,
  ...props
}: InlineProps): ReactElement {
  return renderElement("div", render, {
    ...props,
    className: cx("qx-inline", className),
    "data-slot": "inline",
    "data-gap": gap,
    "data-align": align,
    "data-justify": justify,
    "data-wrap": wrap ? undefined : "false",
  });
}
