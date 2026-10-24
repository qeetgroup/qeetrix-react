import type { ComponentProps, ReactElement } from "react";
import { cx } from "../internal/cx";
import { type RenderProp, renderElement } from "../internal/render";

export interface VisuallyHiddenProps extends ComponentProps<"span"> {
  /** Render a different element. */
  render?: RenderProp;
}

/** Content for screen readers only, e.g. the label of an icon-only control. Never `display: none`. */
export function VisuallyHidden({ render, className, ...props }: VisuallyHiddenProps): ReactElement {
  return renderElement("span", render, {
    ...props,
    className: cx("qx-visually-hidden", className),
    "data-slot": "visually-hidden",
  });
}
