import type { ComponentProps, ReactElement } from "react";
import { cx } from "../internal/cx";
import { type RenderProp, renderElement } from "../internal/render";
import type { Inset } from "../internal/space";

export type BoxBackground =
  | "canvas"
  | "default"
  | "raised"
  | "sunken"
  | "overlay"
  | "inverse"
  | "neutral"
  | "brand"
  | "selected";
export type BoxBorder = "none" | "subtle" | "default" | "strong";
export type BoxRadius =
  | "none"
  | "sm"
  | "control"
  | "surface"
  | "overlay"
  | "modal"
  | "chip"
  | "full";

export interface BoxProps extends ComponentProps<"div"> {
  /** Padding on every side, from the inset tokens. */
  padding?: Inset;
  /** Padding at the start and end; overrides `padding` on those sides. */
  paddingInline?: Inset;
  /** Padding at the top and bottom; overrides `padding` on those sides. */
  paddingBlock?: Inset;
  /** A surface or tint from the tokens. `inverse` also sets inverse text colour. */
  background?: BoxBackground;
  /** A 1px border in a token colour. */
  border?: BoxBorder;
  /** Corners from the radius tokens. */
  radius?: BoxRadius;
  /** Render a different element, e.g. `<section />`. */
  render?: RenderProp;
}

/**
 * A token-only surface: the sanctioned way to give a region padding, a background, a border or
 * corners. It has no margin: space between siblings belongs to the parent's `gap`.
 */
export function Box({
  padding,
  paddingInline,
  paddingBlock,
  background,
  border,
  radius,
  render,
  className,
  ...props
}: BoxProps): ReactElement {
  return renderElement("div", render, {
    ...props,
    className: cx("qx-box", className),
    "data-slot": "box",
    "data-padding": padding,
    "data-padding-inline": paddingInline,
    "data-padding-block": paddingBlock,
    "data-background": background,
    "data-border": border,
    "data-radius": radius,
  });
}
