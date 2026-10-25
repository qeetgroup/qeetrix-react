import type { ComponentProps, ReactElement } from "react";
import { cx } from "../internal/cx";

/** A column's horizontal alignment. */
export type TableAlign = "start" | "center" | "end";

interface CellLook {
  /** Horizontal alignment. Default `start`. */
  align?: TableAlign | undefined;
  /** Numbers, amounts and dates: tabular figures, end-aligned. */
  numeric?: boolean | undefined;
}

/*
 * The table's markup (design rules §15): a header band, rows at the density's row height and 1px
 * lines between them. Internal: apps use Table, which builds every table from these parts, so
 * there is one way to make a table.
 */

export function TableElement({ className, ...props }: ComponentProps<"table">): ReactElement {
  return (
    <table {...props} className={cx("qx-table-element", className)} data-slot="table-element" />
  );
}

export function TableHeader({ className, ...props }: ComponentProps<"thead">): ReactElement {
  return <thead {...props} className={cx("qx-table-header", className)} data-slot="table-header" />;
}

export function TableBody({ className, ...props }: ComponentProps<"tbody">): ReactElement {
  return <tbody {...props} className={cx("qx-table-body", className)} data-slot="table-body" />;
}

/** A row; `selected` gives it the selected tint. Its checked checkbox carries the meaning. */
export function TableRow({
  selected,
  className,
  ...props
}: ComponentProps<"tr"> & { selected?: boolean }): ReactElement {
  return (
    <tr
      {...props}
      className={cx("qx-table-row", className)}
      data-slot="table-row"
      data-selected={selected ? "" : undefined}
    />
  );
}

/** A column header; `scope` is `col`. */
export function TableHead({
  align,
  numeric,
  className,
  ...props
}: Omit<ComponentProps<"th">, "align"> & CellLook): ReactElement {
  return (
    <th
      {...props}
      scope="col"
      className={cx("qx-table-head", className)}
      data-slot="table-head"
      data-align={numeric ? "end" : align}
      data-numeric={numeric ? "" : undefined}
    />
  );
}

export function TableCell({
  align,
  numeric,
  className,
  ...props
}: Omit<ComponentProps<"td">, "align"> & CellLook): ReactElement {
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
