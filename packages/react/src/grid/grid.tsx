import type { ComponentProps, CSSProperties, ReactElement } from "react";
import { cx } from "../internal/cx";
import { listRole } from "../internal/list";
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
  /** Equal columns: one count, or one per window size class. Default `1`. */
  columns?: GridColumnCount | GridColumns;
  /** Space between cells, from the space scale. Default `md` (12px). */
  gap?: Space;
  /** Vertical alignment of cells in a row. Default `stretch`. */
  align?: GridAlign;
  /**
   * Render a different element, e.g. `<ul />` around `<li>` children. A list loses the browser's
   * bullets and indent, and keeps its list role.
   */
  render?: RenderProp;
}

const SIZE_CLASSES = ["base", "medium", "expanded", "large", "xlarge"] as const;

/** A whole number from 1 to 12; the value becomes a CSS variable, so it is never trusted as-is. */
const count = (value: number): number => Math.min(12, Math.max(1, Math.trunc(value) || 1));

/** `--qx-grid-<kind><class>` for each size class that is set: the stylesheet picks the current one. */
function sizeClassVariables(
  kind: "" | "span-" | "start-",
  value: GridColumnCount | GridColumns | undefined,
): Record<string, number> {
  if (value === undefined) return {};
  const perClass: GridColumns = typeof value === "number" ? { base: value } : value;
  const variables: Record<string, number> = {};
  for (const sizeClass of SIZE_CLASSES) {
    const set = perClass[sizeClass];
    if (set !== undefined) variables[`--qx-grid-${kind}${sizeClass}`] = count(set);
  }
  return variables;
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
    ...listRole(render),
    ...props,
    className: cx("qx-grid", className),
    style: { ...(sizeClassVariables("", columns) as CSSProperties), ...style },
    "data-slot": "grid",
    "data-gap": gap,
    "data-align": align,
  });
}

export interface GridItemProps extends ComponentProps<"div"> {
  /**
   * How many of the grid's columns the cell spans: one count, or one per window size class, each
   * inheriting the nearest smaller one that is set. It never spans more columns than the grid has
   * at that size, so a cell can't add a column. Default `1`.
   */
  span?: GridColumnCount | GridColumns;
  /**
   * The column the cell starts in, `1` at the start edge: one, or one per window size class, as
   * `span`. Past the grid's last column, it starts in the last one. Default: the next free cell.
   */
  start?: GridColumnCount | GridColumns;
  /** Render a different element, e.g. `<li />` in a Grid rendered as a list. */
  render?: RenderProp;
}

/**
 * A cell of a Grid that spans columns, e.g. a detail page's main column beside its side column:
 * `<Grid columns={{ base: 1, large: 3 }}>`, then `<GridItem span={{ large: 2 }}>`.
 */
export function GridItem({
  span,
  start,
  render,
  className,
  style,
  ...props
}: GridItemProps): ReactElement {
  const variables = {
    ...sizeClassVariables("span-", span),
    ...sizeClassVariables("start-", start),
  };
  return renderElement("div", render, {
    ...props,
    className: cx("qx-grid-item", className),
    style:
      Object.keys(variables).length > 0 || style
        ? { ...(variables as CSSProperties), ...style }
        : undefined,
    "data-slot": "grid-item",
  });
}
