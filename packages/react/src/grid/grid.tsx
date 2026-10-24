import type { ComponentProps, CSSProperties, ReactElement } from "react";
import { cx } from "../internal/cx";
import { type RenderProp, renderElement } from "../internal/render";
import type { Space } from "../internal/space";

export type GridColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** Columns per window size class. Each class inherits the nearest smaller one that is set. */
export interface GridColumns {
  /** Below 600px, and the starting point for the others. */
  base?: GridColumnCount;
  /** From 600px. */
  medium?: GridColumnCount;
  /** From 840px. */
  expanded?: GridColumnCount;
  /** From 1200px. */
  large?: GridColumnCount;
  /** From 1600px. */
  xlarge?: GridColumnCount;
}

export type GridAlign = "start" | "center" | "end" | "stretch";

export interface GridProps extends ComponentProps<"div"> {
  /** Equal columns: one count, or one per window size class. Default 1. */
  columns?: GridColumnCount | GridColumns;
  /** Space between cells, from the space scale. Default `md` (12px). */
  gap?: Space;
  /** Vertical alignment of cells in a row. Default `stretch`. */
  align?: GridAlign;
  /** Render a different element, e.g. `<ul />`. */
  render?: RenderProp;
}

const SIZE_CLASSES = ["base", "medium", "expanded", "large", "xlarge"] as const;

/** A whole number from 1 to 12; the value becomes a CSS variable, so it is never trusted as-is. */
const count = (value: number): number => Math.min(12, Math.max(1, Math.trunc(value) || 1));

function columnVariables(columns: GridColumnCount | GridColumns): CSSProperties {
  const perClass: GridColumns = typeof columns === "number" ? { base: columns } : columns;
  const variables: Record<string, number> = {};
  for (const sizeClass of SIZE_CLASSES) {
    const value = perClass[sizeClass];
    if (value !== undefined) variables[`--qx-grid-${sizeClass}`] = count(value);
  }
  return variables as CSSProperties;
}

/** Responsive equal columns on the window size classes, with token gaps. */
export function Grid({
  columns = 1,
  gap = "md",
  align,
  render,
  className,
  style,
  ...props
}: GridProps): ReactElement {
  return renderElement("div", render, {
    ...props,
    className: cx("qx-grid", className),
    style: { ...columnVariables(columns), ...style },
    "data-slot": "grid",
    "data-gap": gap,
    "data-align": align,
  });
}
