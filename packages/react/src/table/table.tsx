import type { ComponentProps, ReactElement } from "react";
import { cx } from "../internal/cx";

export type TableAlign = "start" | "center" | "end";

export interface TableProps extends ComponentProps<"table"> {}
export interface TableCaptionProps extends ComponentProps<"caption"> {}
export interface TableHeaderProps extends ComponentProps<"thead"> {}
export interface TableBodyProps extends ComponentProps<"tbody"> {}

export interface TableRowProps extends ComponentProps<"tr"> {
  /** The Ember tint of a selected row. Its checked checkbox carries the meaning. */
  selected?: boolean;
}

interface CellLook {
  /** Horizontal alignment. Default `start`. */
  align?: TableAlign;
  /** Numbers, amounts and dates: tabular figures, end-aligned. */
  numeric?: boolean;
}

// HTML's obsolete `align` attribute gives way to the token-styled prop.
export interface TableHeadProps extends Omit<ComponentProps<"th">, "align">, CellLook {}
export interface TableCellProps extends Omit<ComponentProps<"td">, "align">, CellLook {}

/**
 * A semantic data table (design rules §15): a header band, rows at the density's row height and
 * 1px lines between them. Wide tables go in a ScrollArea. Server-safe.
 */
export function Table({ className, ...props }: TableProps): ReactElement {
  return <table {...props} className={cx("qx-table", className)} data-slot="table" />;
}

/** The table's name, above it. Every table needs a caption or an `aria-label`. */
export function TableCaption({ className, ...props }: TableCaptionProps): ReactElement {
  return (
    <caption {...props} className={cx("qx-table-caption", className)} data-slot="table-caption" />
  );
}

/** The header band. */
export function TableHeader({ className, ...props }: TableHeaderProps): ReactElement {
  return <thead {...props} className={cx("qx-table-header", className)} data-slot="table-header" />;
}

/** The rows. */
export function TableBody({ className, ...props }: TableBodyProps): ReactElement {
  return <tbody {...props} className={cx("qx-table-body", className)} data-slot="table-body" />;
}

/** A row; `selected` tints it. */
export function TableRow({ selected, className, ...props }: TableRowProps): ReactElement {
  return (
    <tr
      {...props}
      className={cx("qx-table-row", className)}
      data-slot="table-row"
      data-selected={selected ? "" : undefined}
    />
  );
}

/** A header cell; `scope` defaults to `col`. */
export function TableHead({
  align,
  numeric,
  scope = "col",
  className,
  ...props
}: TableHeadProps): ReactElement {
  return (
    <th
      {...props}
      scope={scope}
      className={cx("qx-table-head", className)}
      data-slot="table-head"
      data-align={numeric ? "end" : align}
      data-numeric={numeric ? "" : undefined}
    />
  );
}

/** A data cell. */
export function TableCell({ align, numeric, className, ...props }: TableCellProps): ReactElement {
  return (
    <td
      {...props}
      className={cx("qx-table-cell", className)}
      data-slot="table-cell"
      data-align={numeric ? "end" : align}
      data-numeric={numeric ? "" : undefined}
    />
  );
}
