"use client";

import { ChevronLeftIcon } from "@qeetrix/icons/icons/chevron-left";
import { ChevronRightIcon } from "@qeetrix/icons/icons/chevron-right";
import { ChevronsLeftIcon } from "@qeetrix/icons/icons/chevrons-left";
import { ChevronsRightIcon } from "@qeetrix/icons/icons/chevrons-right";
import { type ComponentProps, type ReactElement, type ReactNode, useId } from "react";
import { Button, IconButton } from "../../button/button";
import { formatNumber } from "../../format/format";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { useLocale, useMessages } from "../../provider/provider";
import { Select } from "../../select/select";

interface PaginationBase extends Omit<ComponentProps<"nav">, "children"> {
  /** Rows per page: the `limit` sent to the API. */
  pageSize: number;
  /** Rows this page returned. Default: a full page, or what's left of `total`. */
  itemsOnPage?: number;
  /** The total, when the API returns one. Without it, Next stays on while a full page comes back. */
  total?: number;
  /** Turns the buttons off while the next page loads. Default `false`. */
  loading?: boolean;
  /** Offers these page sizes in a "Rows per page" select. */
  pageSizes?: readonly number[];
  /** Called with the new page size; go back to the first page with it. */
  onPageSizeChange?: (pageSize: number) => void;
  /** Formats the numbers. Default: QeetrixProvider's locale. */
  locale?: string;
  /** This bar's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["pagination"]>;
}

/** Offset/limit paging: the page is where `offset` says. */
export interface OffsetPaginationProps extends PaginationBase {
  /** The zero-based offset of the first row on this page: the `offset` sent to the API. */
  offset: number;
  /** Called with the new offset. */
  onOffsetChange: (offset: number) => void;
  hasPrevious?: never;
  hasNext?: never;
  onPrevious?: never;
  onNext?: never;
}

/**
 * Cursor paging, where the API gives the next page's cursor and no way to jump: Previous and Next
 * only, from `hasPrevious` and `hasNext`.
 */
export interface CursorPaginationProps extends PaginationBase {
  /** The offset of this page's first row, when the page counts them: it shows the range. */
  offset?: number;
  /** A page before this one (the page keeps the cursors it has seen). */
  hasPrevious: boolean;
  /** A page after this one: the API returned a next cursor. */
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onOffsetChange?: never;
}

/** Offset paging (`offset`, `onOffsetChange`) or cursor paging (`hasNext`, `onNext`…). */
export type PaginationProps = OffsetPaginationProps | CursorPaginationProps;

export interface ShowMoreProps extends Omit<ComponentProps<"div">, "children"> {
  /** More to load: the API returned a next cursor. */
  hasMore: boolean;
  /** The next page is loading: the button shows it and ignores clicks. Default `false`. */
  loading?: boolean;
  /** Load the next page and append it. */
  onMore: () => void;
  /** The button's label, e.g. "Show older events". Default "Show more". */
  label?: ReactNode;
  /** Shown once there's nothing more, e.g. "That's everything since 29 September". */
  end?: ReactNode;
  /** This control's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["pagination"]>;
}

/**
 * A catalogue string with each slot's value in its own `<bdi>`: a number keeps its digits in order
 * and can't swap places with its neighbours in right-to-left text.
 */
function isolate(template: string, values: Record<string, string>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const name = /^\{(\w+)\}$/.exec(part)?.[1];
    return name !== undefined && name in values ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: the parts of a fixed template
      <bdi key={index}>{values[name]}</bdi>
    ) : (
      part
    );
  });
}

/**
 * Pages of a list, for offset/limit APIs with or without a total: the range on
 * show ("1–25 of 1,284"), announced politely when it changes, then First, Previous, Next and (with
 * a total) Last, and optionally rows per page. For a cursor API, `hasPrevious` / `hasNext` with
 * `onPrevious` / `onNext` give Previous and Next alone. The chevrons point the reading way in
 * right-to-left layouts.
 */
export function Pagination(all: PaginationProps): ReactElement {
  const {
    offset: offsetProp,
    pageSize,
    itemsOnPage,
    total,
    loading = false,
    onOffsetChange,
    hasPrevious: cursorPrevious,
    hasNext: cursorNext,
    onPrevious,
    onNext,
    pageSizes,
    onPageSizeChange,
    locale: localeProp,
    messages,
    className,
    ...props
  } = all;
  const cursor = onNext !== undefined;
  const offset = offsetProp ?? 0;
  const strings = useMessages("pagination", messages);
  const provided = useLocale();
  const locale = localeProp ?? provided;
  const sizeLabel = useId();

  const rows =
    itemsOnPage ??
    (total === undefined ? pageSize : Math.max(0, Math.min(pageSize, total - offset)));
  const start = rows === 0 ? 0 : offset + 1;
  const end = offset + rows;
  const hasPrevious = cursor ? cursorPrevious === true : offset > 0;
  const hasNext = cursor
    ? cursorNext === true
    : total === undefined
      ? rows >= pageSize
      : offset + pageSize < total;
  const number = (value: number) => formatNumber(value, locale);
  const range =
    total === undefined
      ? isolate(strings.rangeOpen, { start: number(start), end: number(end) })
      : isolate(strings.range, { start: number(start), end: number(end), total: number(total) });

  return (
    <nav
      aria-label={strings.label}
      {...props}
      className={cx("qx-pagination", className)}
      data-slot="pagination"
    >
      {pageSizes && pageSizes.length > 0 && (
        <span className="qx-pagination-size" data-slot="pagination-size">
          <span id={sizeLabel}>{strings.rowsPerPage}</span>
          <Select
            aria-labelledby={sizeLabel}
            items={pageSizes.map((size) => ({ value: size, label: number(size) }))}
            value={pageSize}
            onValueChange={(size) => {
              if (size != null) onPageSizeChange?.(size);
            }}
            className="qx-pagination-size-select"
          />
        </span>
      )}
      {/* The range reads in its own language's direction, whatever the page's: "26–50 of 1,284"
          stays left to right on a right-to-left page. */}
      {(!cursor || offsetProp !== undefined) && (
        <span className="qx-pagination-range" data-slot="pagination-range" role="status" dir="auto">
          {range}
        </span>
      )}
      <span className="qx-pagination-steps">
        {!cursor && (
          <IconButton
            icon={ChevronsLeftIcon}
            aria-label={strings.first}
            tone="neutral"
            size="sm"
            disabled={!hasPrevious || loading}
            onClick={() => onOffsetChange?.(0)}
            className="qx-pagination-step"
          />
        )}
        <IconButton
          icon={ChevronLeftIcon}
          aria-label={strings.previous}
          tone="neutral"
          size="sm"
          disabled={!hasPrevious || loading}
          onClick={() =>
            cursor ? onPrevious?.() : onOffsetChange?.(Math.max(0, offset - pageSize))
          }
          className="qx-pagination-step"
        />
        <IconButton
          icon={ChevronRightIcon}
          aria-label={strings.next}
          tone="neutral"
          size="sm"
          disabled={!hasNext || loading}
          onClick={() => (cursor ? onNext?.() : onOffsetChange?.(offset + pageSize))}
          className="qx-pagination-step"
        />
        {!cursor && total !== undefined && (
          <IconButton
            icon={ChevronsRightIcon}
            aria-label={strings.last}
            tone="neutral"
            size="sm"
            disabled={!hasNext || loading}
            onClick={() =>
              onOffsetChange?.(Math.max(0, Math.ceil(total / pageSize) - 1) * pageSize)
            }
            className="qx-pagination-step"
          />
        )}
      </span>
    </nav>
  );
}

/**
 * "Show more" under a list that grows a page at a time from a cursor API, such as a timeline: the
 * button appends the next page; once there's nothing more, a line says so, announced politely.
 */
export function ShowMore({
  hasMore,
  loading = false,
  onMore,
  label,
  end,
  messages,
  className,
  ...props
}: ShowMoreProps): ReactElement {
  const strings = useMessages("pagination", messages);
  return (
    <div {...props} className={cx("qx-show-more", className)} data-slot="show-more">
      {hasMore ? (
        <Button variant="soft" tone="neutral" size="sm" loading={loading} onClick={onMore}>
          {label ?? strings.more}
        </Button>
      ) : null}
      <span className="qx-show-more-end" role="status">
        {hasMore ? "" : (end ?? strings.end)}
      </span>
    </div>
  );
}
