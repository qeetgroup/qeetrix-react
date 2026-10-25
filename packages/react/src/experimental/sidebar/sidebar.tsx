"use client";

import type { IconProps } from "@qeetrix/icons";
import { ChevronDownIcon } from "@qeetrix/icons/icons/chevron-down";
import {
  Children,
  type ComponentProps,
  type ComponentType,
  type CSSProperties,
  isValidElement,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  useId,
  useState,
} from "react";
import type { QeetrixIcon } from "../../internal/control";
import { cx } from "../../internal/cx";
import { type RenderProp, renderElement } from "../../internal/render";
import { Tooltip } from "../../tooltip/tooltip";
import { useShellState } from "../app-shell/app-shell";

export interface SidebarProps extends Omit<ComponentProps<"div">, "children"> {
  /** Names the navigation landmark, e.g. the product: "Qeet Pay". */
  label: string;
  /** Above the items: the product or organisation switcher. */
  header?: ReactNode;
  /** Below the items: the user menu. */
  footer?: ReactNode;
  /** SidebarGroups. */
  children?: ReactNode;
}

export interface SidebarGroupProps extends Omit<ComponentProps<"div">, "children"> {
  /** The group's label; without one, the group is separated by space alone. */
  label?: ReactNode;
  /** SidebarItems. */
  children?: ReactNode;
}

export interface SidebarItemProps {
  /** The item's text. In the rail it becomes the tooltip and stays the accessible name. */
  label: string;
  /** Where it goes. A category (an item with children) takes no `href`. */
  href?: string;
  /** A router link instead of `<a>`, e.g. `render={<Link to="/users" />}`. */
  render?: RenderProp;
  /** A 16px sharp icon from `@qeetrix/icons`; icons represent destinations, not actions. */
  icon?: QeetrixIcon;
  /** Show the icon's filled drawing while current. Only for icons that have one. */
  filledWhenCurrent?: boolean;
  /** This item is the current page: `aria-current="page"` and the Ember bar. */
  current?: boolean;
  /** At the end: a count or a Badge. Hidden in the rail. */
  badge?: ReactNode;
  /** A category's initial state. By default it starts open when it holds the current page. */
  defaultOpen?: boolean;
  /** Called when the link is followed. */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** One level of nested SidebarItems: the item becomes a category. */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * A console's navigation (07-components.md, C1): links only, one level of nesting, every item in
 * the Tab order. Inside an AppShell it follows the shell: a rail when collapsed, a drawer on narrow
 * screens.
 */
export function Sidebar({
  label,
  header,
  footer,
  className,
  children,
  ...props
}: SidebarProps): ReactElement {
  const { collapsed, inDrawer } = useShellState();
  return (
    <div
      {...props}
      className={cx("qx-sidebar", className)}
      data-slot="sidebar"
      data-rail={collapsed && !inDrawer ? "" : undefined}
    >
      {header != null && (
        <div className="qx-sidebar-header" data-slot="sidebar-header">
          {header}
        </div>
      )}
      <nav aria-label={label} className="qx-sidebar-nav" data-slot="sidebar-nav">
        {children}
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
  onClick,
  className,
  style,
  children,
}: SidebarItemProps): ReactElement {
  const shell = useShellState();
  const rail = shell.collapsed && !shell.inDrawer;
  const panelId = useId();
  const nested = Children.toArray(children).filter(isValidElement);
  const isCategory = nested.length > 0;
  const holdsCurrent = nested.some((child) => (child.props as { current?: boolean }).current);
  const [open, setOpen] = useState(defaultOpen ?? holdsCurrent);
  const expanded = open && !rail;
  const marked = current || (isCategory && holdsCurrent && !expanded);
  const Filled = Icon as ComponentType<IconProps> | undefined;

  const content = (
    <>
      {Icon && (
        <Icon
          shape="sharp"
          size={16}
          aria-hidden
          className="qx-sidebar-icon qx-sidebar-icon-outline"
        />
      )}
      {Filled && filledWhenCurrent && (
        <Filled
          shape="sharp"
          variant="filled"
          size={16}
          aria-hidden
          className="qx-sidebar-icon qx-sidebar-icon-filled"
        />
      )}
      <span className="qx-sidebar-label">{label}</span>
      {badge != null && <span className="qx-sidebar-badge">{badge}</span>}
      {isCategory && (
        <ChevronDownIcon shape="sharp" size={16} aria-hidden className="qx-sidebar-chevron" />
      )}
    </>
  );

  let control: ReactElement = isCategory ? (
    <button
      type="button"
      className="qx-sidebar-item"
      aria-expanded={expanded}
      aria-controls={panelId}
      data-current={marked ? "" : undefined}
      data-open={expanded ? "" : undefined}
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
      href,
      className: "qx-sidebar-item",
      "aria-current": current ? "page" : undefined,
      "data-current": current ? "" : undefined,
      onClick: (event: MouseEvent<HTMLElement>) => {
        onClick?.(event);
        if (shell.inDrawer) shell.closeDrawer();
      },
      children: content,
    })
  );
  if (rail) {
    control = (
      <Tooltip content={label} side="inline-end">
        {control}
      </Tooltip>
    );
  }

  return (
    <li className={cx("qx-sidebar-entry", className)} style={style} data-slot="sidebar-item">
      {control}
      {isCategory && (
        <ul id={panelId} className="qx-sidebar-list qx-sidebar-sublist" hidden={!expanded}>
          {nested}
        </ul>
      )}
    </li>
  );
}
