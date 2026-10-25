"use client";

import type { IconProps } from "@qeetrix/icons";
import { ChevronDownIcon } from "@qeetrix/icons/icons/chevron-down";
import { SearchIcon } from "@qeetrix/icons/icons/search";
import {
  Children,
  type ComponentProps,
  type ComponentType,
  type Context,
  type CSSProperties,
  createContext,
  isValidElement,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  use,
  useId,
  useRef,
  useState,
} from "react";
import { IconButton } from "../../button/button";
import { Input } from "../../input/input";
import type { QeetrixIcon } from "../../internal/control";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { type RenderProp, renderElement } from "../../internal/render";
import { useMessages } from "../../provider/provider";
import { Tooltip } from "../../tooltip/tooltip";
import { useShellState } from "../app-shell/app-shell";

export interface SidebarProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** Names the navigation landmark, e.g. the product: "Qeet Pay". */
  label: string;
  /** The area's heading at the top, e.g. "Identity". */
  title?: ReactNode;
  /** Add "Filter navigation", which narrows the items by label as you type. */
  filter?: boolean;
  /** Below the items, e.g. a link to what's new. */
  footer?: ReactNode;
  /** SidebarGroups. */
  children?: ReactNode;
  /** The filter's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["sidebar"]>;
}

/** The filter's text, lower-cased; and whether an enclosing category matched it by its own label. */
const FilterContext: Context<string> = createContext("");
const ParentMatchContext: Context<boolean> = createContext(false);

export interface SidebarGroupProps extends Omit<ComponentProps<"div">, "children"> {
  /** The group's label; without one, the group is separated by space alone. */
  label?: ReactNode;
  /** SidebarItems. */
  children?: ReactNode;
}

export interface SidebarItemProps
  extends Omit<ComponentProps<"a">, "children" | "className" | "style" | "onClick" | "ref"> {
  /** The item's text. In the rail it becomes the tooltip and stays the accessible name. */
  label: string;
  /** Where it goes. A category (an item with children) takes no `href`. */
  href?: string;
  /** A router link instead of `<a>`, e.g. `render={<Link to="/users" />}`. */
  render?: RenderProp;
  /**
   * A 16px icon from `@qeetrix/icons`, in its round shape: navigation is the one place Qeetrix uses
   * round icons. Icons represent destinations, not actions.
   */
  icon?: QeetrixIcon;
  /** Show the icon's filled drawing while current. Only for icons that have one. */
  filledWhenCurrent?: boolean;
  /** This item is the current page: `aria-current="page"` and the Ember bar. */
  current?: boolean;
  /** At the end: a count or a Badge. Hidden in the rail. */
  badge?: ReactNode;
  /** A category's initial state. By default it starts open when it holds the current page. */
  defaultOpen?: boolean;
  /**
   * Shown but not available, e.g. outside the plan: greyed, out of the Tab order and not followed.
   * A link stays a link, with `aria-disabled`, so screen readers still find it. Default `false`.
   */
  disabled?: boolean;
  /** Called when the link is followed. */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** One level of nested SidebarItems: the item becomes a category. */
  children?: ReactNode;
  /** Placement of the item's row (its `<li>`). */
  className?: string;
  /** Placement of the item's row (its `<li>`). */
  style?: CSSProperties;
  /**
   * The link, or a category's button. The element's other props (`id`, `aria-*`, `data-*`,
   * `target`) go there too.
   */
  ref?: Ref<HTMLElement>;
}

/**
 * A console's navigation: links only, one level of nesting, every item in the Tab order. Inside an
 * AppShell it follows the shell: a rail when collapsed, a drawer on narrow screens.
 */
export function Sidebar({
  label,
  title,
  filter,
  footer,
  messages,
  className,
  children,
  ...props
}: SidebarProps): ReactElement {
  const shell = useShellState();
  const rail = shell.collapsed && !shell.inDrawer;
  const strings = useMessages("sidebar", messages);
  const [query, setQuery] = useState("");
  const filterRef = useRef<HTMLInputElement>(null);
  return (
    <div
      {...props}
      className={cx("qx-sidebar", className)}
      data-slot="sidebar"
      data-rail={rail ? "" : undefined}
    >
      {(title != null || filter) && (
        <div className="qx-sidebar-header" data-slot="sidebar-header">
          {filter && rail && (
            // In the rail, the filter's space holds a shortcut to it: expand, then type.
            <IconButton
              icon={SearchIcon}
              aria-label={strings.filter}
              tone="neutral"
              className="qx-sidebar-rail-search"
              onClick={() => {
                shell.expand();
                requestAnimationFrame(() => filterRef.current?.focus());
              }}
            />
          )}
          {title != null && <div className="qx-sidebar-title">{title}</div>}
          {filter && (
            <Input
              ref={filterRef}
              type="search"
              icon={SearchIcon}
              value={query}
              onValueChange={setQuery}
              aria-label={strings.filter}
              placeholder={strings.filter}
              className="qx-sidebar-filter"
            />
          )}
        </div>
      )}
      <nav aria-label={label} className="qx-sidebar-nav" data-slot="sidebar-nav">
        <FilterContext value={query.trim().toLocaleLowerCase()}>{children}</FilterContext>
        <p className="qx-sidebar-empty" role="status">
          {query.trim() ? strings.noMatches : ""}
        </p>
      </nav>
      {footer != null && (
        <div className="qx-sidebar-footer" data-slot="sidebar-footer">
          {footer}
        </div>
      )}
    </div>
  );
}

/** Items under one label. */
export function SidebarGroup({
  label,
  className,
  children,
  ...props
}: SidebarGroupProps): ReactElement {
  const id = useId();
  return (
    <div {...props} className={cx("qx-sidebar-group", className)} data-slot="sidebar-group">
      {label != null && (
        <div id={id} className="qx-sidebar-group-label" data-slot="sidebar-group-label">
          {label}
        </div>
      )}
      <ul className="qx-sidebar-list" aria-labelledby={label != null ? id : undefined}>
        {children}
      </ul>
    </div>
  );
}

/**
 * A destination, or a category of destinations. A closed category carries the current mark for its
 * current child, so the current page is always marked.
 */
export function SidebarItem({
  label,
  href,
  render,
  icon: Icon,
  filledWhenCurrent,
  current,
  badge,
  defaultOpen,
  disabled = false,
  onClick,
  className,
  style,
  children,
  ...props
}: SidebarItemProps): ReactElement | null {
  const shell = useShellState();
  const query = use(FilterContext);
  const parentMatched = use(ParentMatchContext);
  const rail = shell.collapsed && !shell.inDrawer;
  const panelId = useId();
  const nested = Children.toArray(children).filter(isValidElement);
  const isCategory = nested.length > 0;
  const holdsCurrent = nested.some((child) => (child.props as { current?: boolean }).current);
  const [open, setOpen] = useState(defaultOpen ?? holdsCurrent);

  // Filtering: an item stays if it matches, if its category matched, or if a child matches.
  const matches = (text: string) => text.toLocaleLowerCase().includes(query);
  const selfMatch = query === "" || parentMatched || matches(label);
  const childMatch =
    query !== "" &&
    nested.some((child) => matches(String((child.props as { label?: string }).label)));
  if (!selfMatch && !childMatch) return null;
  const expanded = (query !== "" ? true : open) && !rail;
  const marked = current || (isCategory && holdsCurrent && !expanded);
  const Filled = Icon as ComponentType<IconProps> | undefined;

  const content = (
    <>
      {Icon && (
        <Icon
          shape="round"
          size={16}
          aria-hidden
          className="qx-sidebar-icon qx-sidebar-icon-outline"
        />
      )}
      {Filled && filledWhenCurrent && (
        <Filled
          shape="round"
          variant="filled"
          size={16}
          aria-hidden
          className="qx-sidebar-icon qx-sidebar-icon-filled"
        />
      )}
      {/* The label and its count on one baseline; the pair is centred on the row. */}
      <span className="qx-sidebar-text">
        <span className="qx-sidebar-label">{label}</span>
        {badge != null && (
          <span className="qx-sidebar-badge" data-slot="sidebar-item-badge">
            {badge}
          </span>
        )}
      </span>
      {isCategory && (
        <ChevronDownIcon shape="round" size={16} aria-hidden className="qx-sidebar-chevron" />
      )}
    </>
  );

  let control: ReactElement = isCategory ? (
    <button
      {...(props as ComponentProps<"button">)}
      type="button"
      className="qx-sidebar-item"
      aria-expanded={expanded}
      aria-controls={panelId}
      disabled={disabled}
      data-current={marked ? "" : undefined}
      data-open={expanded ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      onClick={() => {
        if (rail) {
          shell.expand();
          setOpen(true);
        } else {
          setOpen(!open);
        }
      }}
    >
      {content}
    </button>
  ) : (
    renderElement("a", render, {
      ...props,
      // Disabled, it keeps the link role without an href, so it can't be followed or tabbed to.
      ...(disabled
        ? { role: "link", "aria-disabled": true, tabIndex: render ? -1 : undefined }
        : { href }),
      className: "qx-sidebar-item",
      "aria-current": current ? "page" : undefined,
      "data-current": current ? "" : undefined,
      "data-disabled": disabled ? "" : undefined,
      onClick: (event: MouseEvent<HTMLElement>) => {
        if (disabled) {
          // A router link checks this before it navigates.
          event.preventDefault();
          return;
        }
        onClick?.(event);
        if (shell.inDrawer) shell.closeDrawer();
      },
      children: content,
    })
  );
  // The tooltip wrapper is always there, disabled outside the rail: the element tree stays the
  // same when the rail expands under the pointer, so a click that started in the rail still lands.
  control = (
    <Tooltip content={label} side="inline-end" disabled={!rail}>
      {control}
    </Tooltip>
  );

  return (
    <li className={cx("qx-sidebar-entry", className)} style={style} data-slot="sidebar-item">
      {control}
      {isCategory && (
        <ul id={panelId} className="qx-sidebar-list qx-sidebar-sublist" hidden={!expanded}>
          <ParentMatchContext value={query !== "" && matches(label)}>{nested}</ParentMatchContext>
        </ul>
      )}
    </li>
  );
}
