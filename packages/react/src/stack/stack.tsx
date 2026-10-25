import type { ComponentProps, ReactElement } from "react";
import { cx } from "../internal/cx";
import { listRole } from "../internal/list";
import { type RenderProp, renderElement } from "../internal/render";
import type { Space } from "../internal/space";

export type StackAlign = "start" | "center" | "end" | "stretch";
export type FlowJustify = "start" | "center" | "end" | "between";

export interface StackProps extends ComponentProps<"div"> {
  /** Space between children, from the space scale. Default `md` (12px). */
  gap?: Space;
  /** Cross-axis alignment. Default `stretch`. */
  align?: StackAlign;
  /** Main-axis distribution. */
  justify?: FlowJustify;
  /**
   * Render a different element, e.g. `<ul />` around `<li>` children. A list loses the browser's
   * bullets and indent, and keeps its list role.
   */
  render?: RenderProp;
}

/** A vertical flow with token gaps. */
export function Stack({
  gap = "md",
  align,
  justify,
  render,
  className,
  ...props
}: StackProps): ReactElement {
  return renderElement("div", render, {
    ...listRole(render),
    ...props,
    className: cx("qx-stack", className),
    "data-slot": "stack",
    "data-gap": gap,
    "data-align": align,
    "data-justify": justify,
  });
}
