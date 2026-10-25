"use client";

import { XIcon } from "@qeetrix/icons/icons/x";
import {
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
} from "react";
import { Button, IconButton } from "../../button/button";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { fill } from "../../internal/template";
import { useMessages } from "../../provider/provider";

/** One filter applied to a list: "Status: Active". */
export interface AppliedFilter {
  /** Stable, for `onRemove`. */
  id: string;
  /** What's filtered: "Status". */
  label: string;
  /** What it's filtered to: "Active", or "Engineering, Finance". */
  value: string;
}

export interface FilterTagsProps extends Omit<ComponentProps<"div">, "children"> {
  filters: readonly AppliedFilter[];
  /** Called with a filter's id when its tag is removed. */
  onRemove: (id: string) => void;
  /** Called by Clear all; without it there's no Clear all. */
  onClear?: () => void;
  /** At the end: how many records the filters leave, "412 of 1,284 users". Announced as it changes. */
  summary?: ReactNode;
  /** Where focus goes once no filters are left, such as the search field. */
  returnFocusTo?: RefObject<HTMLElement | null>;
  /** These tags' strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["filterTags"]>;
}

/**
 * The filters applied to a list, each a tag you can remove (07-components.md), under its toolbar:
 * "Status: Active ×". Clear all removes them all, and a summary says how many records are left.
 * Not a Badge: a Badge is a static label in the data, a tag is a choice someone made. After a
 * removal, focus moves to the next tag, then the previous, then `returnFocusTo`. Renders nothing
 * when no filters are applied.
 */
export function FilterTags({
  filters,
  onRemove,
  onClear,
  summary,
  returnFocusTo,
  messages,
  className,
  ...props
}: FilterTagsProps): ReactElement | null {
  const strings = useMessages("filterTags", messages);
  const list = useRef<HTMLUListElement>(null);
  // The tag to focus once a removal has re-rendered the list, or -1 for none.
  const focusNext = useRef(-1);

  useEffect(() => {
    if (focusNext.current < 0) return;
    const buttons = list.current?.querySelectorAll<HTMLElement>(".qx-filter-tag-remove");
    const target = buttons?.[Math.min(focusNext.current, buttons.length - 1)];
    focusNext.current = -1;
    if (target) target.focus();
    else returnFocusTo?.current?.focus();
  });

  if (filters.length === 0) {
    return summary == null ? null : (
      <div {...props} className={cx("qx-filter-tags", className)} data-slot="filter-tags">
        <span className="qx-filter-tags-summary" aria-live="polite">
          {summary}
        </span>
      </div>
    );
  }

  return (
    <div {...props} className={cx("qx-filter-tags", className)} data-slot="filter-tags">
      <ul ref={list} aria-label={strings.label} className="qx-filter-tags-list">
        {filters.map((filter, index) => (
          <li key={filter.id} className="qx-filter-tag" data-slot="filter-tag">
            <span className="qx-filter-tag-label">{filter.label}:</span>
            <span className="qx-filter-tag-value">{filter.value}</span>
            <IconButton
              icon={XIcon}
              aria-label={fill(strings.remove, { filter: `${filter.label}: ${filter.value}` })}
              size="sm"
              tone="neutral"
              tooltip={false}
              className="qx-filter-tag-remove"
              onClick={() => {
                focusNext.current = index;
                onRemove(filter.id);
              }}
            />
          </li>
        ))}
      </ul>
      {onClear && filters.length > 1 && (
        <Button
          variant="ghost"
          tone="neutral"
          size="sm"
          onClick={() => {
            onClear();
            returnFocusTo?.current?.focus();
          }}
        >
          {strings.clear}
        </Button>
      )}
      {summary != null && (
        <span className="qx-filter-tags-summary" aria-live="polite">
          {summary}
        </span>
      )}
    </div>
  );
}
