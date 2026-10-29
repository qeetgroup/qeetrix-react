"use client";

import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { CheckIcon } from "@qeetrix/icons/icons/check";
import { ChevronRightIcon } from "@qeetrix/icons/icons/chevron-right";
import {
  type Context,
  type CSSProperties,
  createContext,
  type ReactElement,
  type ReactNode,
  use,
  useId,
} from "react";
import { cx } from "../internal/cx";
import { drawIcon, type IconSource } from "../internal/icon";
import { usePortalContainer } from "../provider/provider";

/**
 * Where a MenuContent opens: below a Menu's trigger, at the inline end of a submenu's trigger item
 * (its first item lined up with the trigger), or at the pointer for a ContextMenu.
 */
type MenuKind = "menu" | "submenu" | "context";
const MenuKindContext: Context<MenuKind> = createContext<MenuKind>("menu");

export type MenuProps = BaseMenu.Root.Props;
export type MenuTriggerProps = BaseMenu.Trigger.Props;
export type MenuSubmenuProps = BaseMenu.SubmenuRoot.Props;
export type MenuItemTone = "default" | "danger";
export type ContextMenuProps = BaseContextMenu.Root.Props;
export interface ContextMenuTriggerProps extends Omit<BaseContextMenu.Trigger.Props, "className"> {
  /** Placement and sizing only. */
  className?: string;
}

export interface MenuContentProps
  extends Omit<BaseMenu.Popup.Props, "className" | "style" | "children"> {
  /**
   * The side to open on. By default a menu opens below its trigger, a submenu at the inline end,
   * and a context menu at the pointer.
   */
  side?: BaseMenu.Positioner.Props["side"];
  /** Alignment along that side. Default `start`. */
  align?: BaseMenu.Positioner.Props["align"];
  /**
   * Distance from the trigger, in pixels. Default `4`; `0` for a submenu; for a context menu, the
   * first item lines up with the pointer.
   */
  sideOffset?: number;
  /** Placement and sizing only. */
  className?: string;
  /** Inline styles for the popup, for placement and sizing only. */
  style?: CSSProperties;
  /** The items: MenuItem, MenuCheckboxItem, MenuRadioGroup, MenuGroup, MenuSubmenu and so on. */
  children?: ReactNode;
}

interface ItemLookProps {
  /** Text at the end, such as a keyboard shortcut ("Ctrl+D"). Hidden from assistive technology. */
  shortcut?: ReactNode;
  /**
   * A second, subtle line under the label, for menus that explain each choice. It describes the
   * item to assistive technology; the label alone names it.
   */
  description?: ReactNode;
  /** Placement only. */
  className?: string;
  /** Inline styles for the item, for placement only. */
  style?: CSSProperties;
}

export interface MenuItemProps
  extends Omit<BaseMenu.Item.Props, "className" | "style">,
    ItemLookProps {
  /** A leading icon from `@qeetrix/icons`: sharp, 16px. */
  icon?: IconSource;
  /** `danger` for a destructive action; put it last, after a separator. Default `default`. */
  tone?: MenuItemTone;
}

export interface MenuCheckboxItemProps
  extends Omit<BaseMenu.CheckboxItem.Props, "className" | "style">,
    ItemLookProps {}

export interface MenuRadioItemProps
  extends Omit<BaseMenu.RadioItem.Props, "className" | "style">,
    ItemLookProps {
  /**
   * Close the menu once this item is chosen, as a menu that picks one value should. Pass `false`
   * where several settings are changed in a row. A closed menu unmounts its items, so hold the
   * choice in state (MenuRadioGroup's `value` / `onValueChange`). Default `true`.
   */
  closeOnClick?: boolean;
}

export interface MenuSubmenuTriggerProps
  extends Omit<BaseMenu.SubmenuTrigger.Props, "className" | "style"> {
  /** A leading icon from `@qeetrix/icons`: sharp, 16px. */
  icon?: IconSource;
  /** Placement only. */
  className?: string;
  /** Inline styles for the item, for placement only. */
  style?: CSSProperties;
}

export type MenuGroupProps = BaseMenu.Group.Props;
export interface MenuGroupLabelProps extends Omit<BaseMenu.GroupLabel.Props, "className"> {
  /** Placement only. */
  className?: string;
}
export type MenuRadioGroupProps = BaseMenu.RadioGroup.Props;
export interface MenuSeparatorProps extends Omit<BaseMenu.Separator.Props, "className"> {
  /** Placement only. */
  className?: string;
}

/** Holds a menu's open state: `open` / `defaultOpen` / `onOpenChange(open, details)`. */
export function Menu(props: MenuProps): ReactElement {
  return (
    <MenuKindContext value="menu">
      <BaseMenu.Root {...props} />
    </MenuKindContext>
  );
}

/** Opens the menu. Render your own control: `render={<IconButton aria-label="More" … />}`. */
export function MenuTrigger(props: MenuTriggerProps): ReactElement {
  return <BaseMenu.Trigger {...props} />;
}

/**
 * A menu that opens at the pointer: on right-click or a long press on its ContextMenuTrigger, or on
 * Shift+F10 or the context menu key while focus is in it. It takes the same MenuContent and items
 * as Menu. Holds the open state: `open` / `defaultOpen` / `onOpenChange(open, details)`.
 */
export function ContextMenu(props: ContextMenuProps): ReactElement {
  return (
    <MenuKindContext value="context">
      <BaseContextMenu.Root {...props} />
    </MenuKindContext>
  );
}

/** Shift+F10 and the context menu key, which open a context menu from the keyboard. */
const isContextMenuKey = (event: { key: string; shiftKey: boolean }): boolean =>
  event.key === "ContextMenu" || (event.shiftKey && event.key === "F10");

/**
 * The area that opens a ContextMenu: a row, a card, a canvas. Right-click or a long press opens the
 * menu at the pointer; Shift+F10 or the context menu key opens it at the focused element, so put it
 * around content that takes focus, or give it `tabIndex={0}`.
 */
export function ContextMenuTrigger({
  className,
  onKeyDown,
  ...props
}: ContextMenuTriggerProps): ReactElement {
  return (
    <BaseContextMenu.Trigger
      {...props}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || !isContextMenuKey(event)) return;
        // Browsers send a contextmenu event for these keys inconsistently (Chromium only for the
        // menu key, Firefox and WebKit not at all), so send one, at the focused element's centre,
        // as Chromium does. Cancelling the key stops the browser sending its own as well.
        event.preventDefault();
        const target = event.target as HTMLElement;
        const box = target.getBoundingClientRect();
        target.dispatchEvent(
          new MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
            clientX: box.left + box.width / 2,
            clientY: box.top + box.height / 2,
          }),
        );
      }}
      className={cx("qx-context-menu-trigger", className)}
      data-slot="context-menu-trigger"
    />
  );
}

/**
 * The list of actions: arrow keys move, typing jumps to a match, Escape closes and returns focus to
 * the trigger. It never traps Tab.
 */
export function MenuContent({
  side,
  align = "start",
  sideOffset,
  className,
  children,
  ...props
}: MenuContentProps): ReactElement {
  const portalContainer = usePortalContainer();
  const kind = use(MenuKindContext);
  return (
    <BaseMenu.Portal container={portalContainer}>
      <BaseMenu.Positioner
        side={side}
        align={align}
        // A submenu's first item lines up with its trigger: the popup's padding plus its border.
        // A context menu leaves it to Base UI, which lines its first item up with the pointer.
        sideOffset={kind === "context" ? sideOffset : (sideOffset ?? (kind === "submenu" ? 0 : 4))}
        alignOffset={kind === "context" ? undefined : kind === "submenu" ? -5 : 0}
        className="qx-menu-positioner"
        data-slot="menu-positioner"
      >
        <BaseMenu.Popup {...props} className={cx("qx-menu", className)} data-slot="menu-popup">
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

function Shortcut({ children }: { children: ReactNode }): ReactElement | null {
  if (children == null) return null;
  return (
    <span className="qx-menu-shortcut" data-slot="menu-shortcut" aria-hidden>
      {children}
    </span>
  );
}

interface ItemText {
  /** The item's props for its description, and the typeahead text. */
  props: { "aria-describedby"?: string; label?: string };
  /** The label, or the label above its description. */
  text: ReactElement;
}

/**
 * An item's label, and its description when it has one. The label names the item (its content,
 * with the description left out) and the description describes it; typing matches the label.
 */
function useItemText(children: ReactNode, description: ReactNode): ItemText {
  const id = useId();
  const label = (
    <span className="qx-menu-item-label" data-slot="menu-item-label">
      {children}
    </span>
  );
  if (description == null) return { props: {}, text: label };
  return {
    props: {
      "aria-describedby": id,
      ...(typeof children === "string" ? { label: children } : {}),
    },
    text: (
      <span className="qx-menu-item-text" data-slot="menu-item-text">
        {label}
        {/* Hidden from the name, which the content gives; it's read as the description. */}
        <span
          id={id}
          aria-hidden
          className="qx-menu-item-description"
          data-slot="menu-item-description"
        >
          {description}
        </span>
      </span>
    ),
  };
}

/** An action. */
export function MenuItem({
  icon: Icon,
  shortcut,
  description,
  tone,
  className,
  children,
  ...props
}: MenuItemProps): ReactElement {
  const item = useItemText(children, description);
  return (
    <BaseMenu.Item
      {...item.props}
      {...props}
      className={cx("qx-menu-item", className)}
      data-slot="menu-item"
      data-tone={tone}
      data-description={description != null ? "" : undefined}
    >
      {Icon &&
        drawIcon(Icon, { size: 16, className: "qx-menu-item-icon", "data-slot": "menu-item-icon" })}
      {item.text}
      <Shortcut>{shortcut}</Shortcut>
    </BaseMenu.Item>
  );
}

/** An option that turns on or off; a sharp check marks it. */
export function MenuCheckboxItem({
  shortcut,
  description,
  className,
  children,
  ...props
}: MenuCheckboxItemProps): ReactElement {
  const item = useItemText(children, description);
  return (
    <BaseMenu.CheckboxItem
      {...item.props}
      {...props}
      className={cx("qx-menu-item", className)}
      data-slot="menu-checkbox-item"
      data-description={description != null ? "" : undefined}
    >
      <span className="qx-menu-mark" data-slot="menu-item-mark">
        <BaseMenu.CheckboxItemIndicator className="qx-menu-mark-indicator">
          <CheckIcon shape="sharp" size={16} aria-hidden />
        </BaseMenu.CheckboxItemIndicator>
      </span>
      {item.text}
      <Shortcut>{shortcut}</Shortcut>
    </BaseMenu.CheckboxItem>
  );
}

/** One choice of a MenuRadioGroup; a 6px dot marks it. */
export function MenuRadioItem({
  shortcut,
  description,
  closeOnClick = true,
  className,
  children,
  ...props
}: MenuRadioItemProps): ReactElement {
  const item = useItemText(children, description);
  return (
    <BaseMenu.RadioItem
      {...item.props}
      {...props}
      closeOnClick={closeOnClick}
      className={cx("qx-menu-item", className)}
      data-slot="menu-radio-item"
      data-description={description != null ? "" : undefined}
    >
      <span className="qx-menu-mark" data-slot="menu-item-mark">
        <BaseMenu.RadioItemIndicator className="qx-menu-mark-indicator qx-menu-dot" />
      </span>
      {item.text}
      <Shortcut>{shortcut}</Shortcut>
    </BaseMenu.RadioItem>
  );
}

/** Radio items sharing one value: `value` / `defaultValue` / `onValueChange(value, details)`. */
export function MenuRadioGroup(props: MenuRadioGroupProps): ReactElement {
  return <BaseMenu.RadioGroup {...props} />;
}

/** Items under one label. */
export function MenuGroup(props: MenuGroupProps): ReactElement {
  return <BaseMenu.Group {...props} />;
}

/** A group's label. */
export function MenuGroupLabel({ className, ...props }: MenuGroupLabelProps): ReactElement {
  return (
    <BaseMenu.GroupLabel
      {...props}
      className={cx("qx-menu-group-label", className)}
      data-slot="menu-group-label"
    />
  );
}

/** A 1px rule between groups, edge to edge. */
export function MenuSeparator({ className, ...props }: MenuSeparatorProps): ReactElement {
  return (
    <BaseMenu.Separator
      {...props}
      className={cx("qx-menu-separator", className)}
      data-slot="menu-separator"
    />
  );
}

/** A nested menu: a MenuSubmenuTrigger and its own MenuContent. */
export function MenuSubmenu(props: MenuSubmenuProps): ReactElement {
  return (
    <MenuKindContext value="submenu">
      <BaseMenu.SubmenuRoot {...props} />
    </MenuKindContext>
  );
}

/** The item that opens a submenu, with a trailing chevron that mirrors in right-to-left text. */
export function MenuSubmenuTrigger({
  icon: Icon,
  className,
  children,
  ...props
}: MenuSubmenuTriggerProps): ReactElement {
  return (
    <BaseMenu.SubmenuTrigger
      {...props}
      className={cx("qx-menu-item", className)}
      data-slot="menu-submenu-trigger"
    >
      {Icon &&
        drawIcon(Icon, { size: 16, className: "qx-menu-item-icon", "data-slot": "menu-item-icon" })}
      <span className="qx-menu-item-label" data-slot="menu-item-label">
        {children}
      </span>
      <ChevronRightIcon
        shape="sharp"
        size={16}
        aria-hidden
        className="qx-menu-submenu-icon"
        data-slot="menu-submenu-icon"
      />
    </BaseMenu.SubmenuTrigger>
  );
}
