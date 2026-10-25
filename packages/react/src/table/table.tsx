"use client";

import { ArrowDownIcon } from "@qeetrix/icons/icons/arrow-down";
import { ArrowUpIcon } from "@qeetrix/icons/icons/arrow-up";
import { ChevronsUpDownIcon } from "@qeetrix/icons/icons/chevrons-up-down";
import { EllipsisIcon } from "@qeetrix/icons/icons/ellipsis";
import { type ComponentProps, type ReactElement, type ReactNode, useRef, useState } from "react";
import { Button, IconButton } from "../button/button";
import { Checkbox } from "../checkbox/checkbox";
import { cx } from "../internal/cx";
import type { QeetrixMessages } from "../internal/messages";
import { fill } from "../internal/template";
import { Menu, MenuContent, MenuTrigger } from "../menu/menu";
import { useMessages } from "../provider/provider";
import { Skeleton } from "../skeleton/skeleton";
import { VisuallyHidden } from "../visually-hidden/visually-hidden";
import {
  type TableAlign,
  TableBody,
  TableCell,
  TableElement,
  TableHead,
  TableHeader,
  TableRow,
} from "./parts";

export type { TableAlign } from "./parts";

export type SortDirection = "ascending" | "descending";

/** Which column the rows are sorted by, and which way. */
export interface TableSort {
  /** The column's `id`. */
  column: string;
  direction: SortDirection;
}

export interface TableColumn<Row> {
  /** Unique among the columns; a sort names it. */
  id: string;
  /** The header: text, or visually hidden text over a column of icons. */
  header: ReactNode;
  /** The cell for a row. */
  cell: (row: Row) => ReactNode;
  /** Clicking the header sorts by this column. */
  sortable?: boolean;
  /** The first way a click sorts: `descending` for dates and amounts, newest or largest first. Default `ascending`. */
  sortFirst?: SortDirection;
  /** Horizontal alignment. Default `start`. */
  align?: TableAlign;
  /** Numbers, amounts and dates: tabular figures, end-aligned. */
  numeric?: boolean;
  /** A fixed width, such as `120` or `"20%"`; the other columns share the rest. */
  width?: number | string;
}

export interface TableProps<Row> extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /** Names the table for assistive technology: "Users". */
  label: string;
  /** The rows on show: for a server-paged list, this page. */
  rows: readonly Row[];
  /** A row's stable ID, for selection and React keys. */
  rowId: (row: Row) => string;
  /** A row's name in its checkbox and actions button: "Select Priya Sharma". */
  rowLabel: (row: Row) => string;
  columns: readonly TableColumn<Row>[];
  /** The sort, controlled; `null` for the server's own order. The rows arrive sorted. */
  sort?: TableSort | null;
  /** The sort when uncontrolled. */
  defaultSort?: TableSort | null;
  /** Called with the new sort when a header is clicked. */
  onSortChange?: (sort: TableSort | null) => void;
  /** Rows have checkboxes, and the header one selects the whole page. */
  selectable?: boolean;
  /** Selected row IDs, controlled. They may include rows on other pages. */
  selected?: readonly string[];
  /** Selected row IDs when uncontrolled. */
  defaultSelected?: readonly string[];
  /** Called with the new selection. */
  onSelectedChange?: (ids: string[]) => void;
  /** Buttons for the selection, in a bar that takes the toolbar's place while any row is selected. */
  bulkActions?: (ids: string[]) => ReactNode;
  /** Above the table while nothing is selected: search and filters. */
  toolbar?: ReactNode;
  /** A row's actions, as MenuItems, in a menu at its end. */
  rowActions?: (row: Row) => ReactNode;
  /** Rows are loading: placeholders when there are none yet, otherwise the old rows dim. */
  loading?: boolean;
  /** Placeholder rows while the first rows load. Default 5. */
  loadingRows?: number;
  /** In place of the rows when there are none, e.g. an EmptyState. Default: "No results". */
  empty?: ReactNode;
  /** In place of the rows when they couldn't load, e.g. an EmptyState with a retry button. */
  error?: ReactNode;
  /** This table's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["table"]>;
}

/**
 * The table (07-components.md; design rules §15): the one way to show records, from a few
 * read-only rows to a console list of users, sessions or audit events. Give it `columns` and
 * `rows`; everything else is optional. Built for server-paged lists: the rows arrive sorted and
 * paged, and the table holds the sort and the selection. Sortable headers are buttons and
 * `aria-sort` marks the sorted one; a click sorts one way, then the other, then back to the
 * server's order. With `selectable`, each row has a checkbox, the header's selects or clears the
 * page, and a bar with the count, `bulkActions` and Clear takes the toolbar's place. `rowActions`
 * puts a menu at each row's end. Loading, empty and error states sit in the table, under its
 * header, which sticks while the page scrolls. Rows follow the density's row height. Pair it with
 * Pagination; put a wide table in a ScrollArea.
 */
export function Table<Row>({
  label,
  rows,
  rowId,
  rowLabel,
  columns,
  sort,
  defaultSort = null,
  onSortChange,
  selectable = false,
  selected,
  defaultSelected = [],
  onSelectedChange,
  bulkActions,
  toolbar,
  rowActions,
  loading = false,
  loadingRows = 5,
  empty,
  error,
  messages,
  className,
  ...props
}: TableProps<Row>): ReactElement {
  const strings = useMessages("table", messages);
  const selectAll = useRef<HTMLButtonElement>(null);
  const [ownSort, setOwnSort] = useState(defaultSort);
  const currentSort = sort === undefined ? ownSort : sort;
  const [ownSelected, setOwnSelected] = useState(defaultSelected);
  const chosen = selected ?? ownSelected;

  const setSort = (next: TableSort | null) => {
    if (sort === undefined) setOwnSort(next);
    onSortChange?.(next);
  };
  const setChosen = (next: string[]) => {
    if (selected === undefined) setOwnSelected(next);
    onSelectedChange?.(next);
  };

  // One way, the other, then the server's order again.
  const sortBy = ({ id, sortFirst = "ascending" }: TableColumn<Row>) => {
    const second = sortFirst === "ascending" ? "descending" : "ascending";
    if (currentSort?.column !== id) setSort({ column: id, direction: sortFirst });
    else if (currentSort.direction === sortFirst) setSort({ column: id, direction: second });
    else setSort(null);
  };

  // The header checkbox speaks for this page; rows selected on other pages stay selected.
  const ids = rows.map(rowId);
  const isChosen = new Set(chosen);
  const chosenHere = ids.filter((id) => isChosen.has(id)).length;
  const allHere = ids.length > 0 && chosenHere === ids.length;
  const toggleAll = () =>
    setChosen(
      allHere
        ? chosen.filter((id) => !ids.includes(id))
        : [...chosen, ...ids.filter((id) => !isChosen.has(id))],
    );
  const toggle = (id: string) =>
    setChosen(isChosen.has(id) ? chosen.filter((other) => other !== id) : [...chosen, id]);

  const span = columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);
  const count = fill(strings.selected, { count: chosen.length });
  const barred = selectable && chosen.length > 0;
  /** One cell across the table, under the header: the empty, error and loading messages. */
  const message = (content: ReactNode) => (
    <TableRow className="qx-table-message">
      <TableCell colSpan={span}>{content}</TableCell>
    </TableRow>
  );

  let body: ReactNode;
  if (error != null) body = message(error);
  else if (rows.length === 0 && loading) {
    body = Array.from({ length: loadingRows }, (_, row) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: placeholder rows are positions
      <TableRow key={row} className="qx-table-placeholder" aria-hidden>
        {Array.from({ length: span }, (_, column) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: placeholder cells are positions
          <TableCell key={column}>
            <Skeleton />
          </TableCell>
        ))}
      </TableRow>
    ));
  } else if (rows.length === 0) {
    body = message(empty ?? <p className="qx-table-empty">{strings.empty}</p>);
  } else {
    body = rows.map((row, index) => {
      const id = ids[index] ?? "";
      const name = rowLabel(row);
      return (
        <TableRow key={id} selected={isChosen.has(id)}>
          {selectable && (
            <TableCell className="qx-table-select">
              <Checkbox
                aria-label={fill(strings.selectRow, { row: name })}
                checked={isChosen.has(id)}
                onCheckedChange={() => toggle(id)}
              />
            </TableCell>
          )}
          {columns.map((column) => (
            <TableCell key={column.id} align={column.align} numeric={column.numeric}>
              {column.cell(row)}
            </TableCell>
          ))}
          {rowActions && (
            <TableCell className="qx-table-actions" align="end">
              <Menu>
                <MenuTrigger
                  render={
                    <IconButton
                      icon={EllipsisIcon}
                      aria-label={fill(strings.rowActions, { row: name })}
                      tone="neutral"
                      size="sm"
                      tooltip={false}
                    />
                  }
                />
                <MenuContent align="end">{rowActions(row)}</MenuContent>
              </Menu>
            </TableCell>
          )}
        </TableRow>
      );
    });
  }

  return (
    <div
      {...props}
      className={cx("qx-table", className)}
      data-slot="table"
      data-loading={loading && rows.length > 0 ? "" : undefined}
    >
      {(barred || toolbar != null) && (
        <div className="qx-table-bar" data-slot="table-bar" data-selected={barred ? "" : undefined}>
          {barred ? (
            <>
              <span className="qx-table-count">{count}</span>
              <div className="qx-table-bulk">{bulkActions?.([...chosen])}</div>
              <Button
                variant="ghost"
                tone="neutral"
                size="sm"
                onClick={() => {
                  setChosen([]);
                  selectAll.current?.focus();
                }}
              >
                {strings.clear}
              </Button>
            </>
          ) : (
            toolbar
          )}
        </div>
      )}
      <TableElement aria-label={label} aria-busy={loading || undefined}>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="qx-table-select">
                <Checkbox
                  ref={selectAll}
                  aria-label={strings.selectAll}
                  checked={allHere}
                  indeterminate={chosenHere > 0 && !allHere}
                  disabled={ids.length === 0}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
            )}
            {columns.map((column) => {
              const direction =
                currentSort?.column === column.id ? currentSort.direction : undefined;
              const Icon =
                direction === "ascending"
                  ? ArrowUpIcon
                  : direction === "descending"
                    ? ArrowDownIcon
                    : ChevronsUpDownIcon;
              return (
                <TableHead
                  key={column.id}
                  align={column.align}
                  numeric={column.numeric}
                  aria-sort={direction}
                  data-sorted={direction ? "" : undefined}
                  style={column.width === undefined ? undefined : { inlineSize: column.width }}
                >
                  {column.sortable ? (
                    <button type="button" className="qx-table-sort" onClick={() => sortBy(column)}>
                      {column.header}
                      <Icon shape="sharp" size={14} aria-hidden className="qx-table-sort-icon" />
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              );
            })}
            {rowActions && (
              <TableHead className="qx-table-actions">
                <VisuallyHidden>{strings.actions}</VisuallyHidden>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>{body}</TableBody>
      </TableElement>
      <VisuallyHidden aria-live="polite">
        {loading && rows.length === 0 ? strings.loading : barred ? count : ""}
      </VisuallyHidden>
    </div>
  );
}
