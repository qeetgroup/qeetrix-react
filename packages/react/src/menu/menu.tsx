"use client";

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
} from "react";
import type { QeetrixIcon } from "../internal/control";
import { cx } from "../internal/cx";

/** True inside a submenu, whose content lines its first item up with the trigger item. */
const InSubmenu: Context<boolean> = createContext(false);

export type MenuProps = BaseMenu.Root.Props;
export type MenuTriggerProps = BaseMenu.Trigger.Props;
export type MenuSubmenuProps = BaseMenu.SubmenuRoot.Props;
export type MenuItemTone = "default" | "danger";

export interface MenuContentProps
  extends Omit<BaseMenu.Popup.Props, "className" | "style" | "children"> {
  /** The side to open on. By default a menu opens below its trigger, a submenu at the inline end. */
  side?: BaseMenu.Positioner.Props["side"];
  /** Alignment along that side. Default `start`. */
  align?: BaseMenu.Positioner.Props["align"];
  /** Distance from the trigger, in pixels. Default 4 (0 for a submenu). */
  sideOffset?: number;
  /** Placement and sizing only. */
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

interface ItemLookProps {
  /** Text at the end, such as a keyboard shortcut ("Ctrl+D"). Hidden from assistive technology. */
  shortcut?: ReactNode;
  /** Placement only. */
  className?: string;
  style?: CSSProperties;
}

export interface MenuItemProps
  extends Omit<BaseMenu.Item.Props, "className" | "style">,
    ItemLookProps {
  /** A leading icon from `@qeetrix/icons`: sharp, 16px. */
  icon?: QeetrixIcon;
  /** `danger` for a destructive action; put it last, after a separator. */
  tone?: MenuItemTone;
}

export interface MenuCheckboxItemProps
  extends Omit<BaseMenu.CheckboxItem.Props, "className" | "style">,
    ItemLookProps {}

export interface MenuRadioItemProps
  extends Omit<BaseMenu.RadioItem.Props, "className" | "style">,
    ItemLookProps {}

export interface MenuSubmenuTriggerProps
  extends Omit<BaseMenu.SubmenuTrigger.Props, "className" | "style"> {
  /** A leading icon from `@qeetrix/icons`: sharp, 16px. */
  icon?: QeetrixIcon;
  className?: string;
  style?: CSSProperties;
}

export type MenuGroupProps = BaseMenu.Group.Props;
export interface MenuGroupLabelProps extends Omit<BaseMenu.GroupLabel.Props, "className"> {
  className?: string;
}
export type MenuRadioGroupProps = BaseMenu.RadioGroup.Props;
export interface MenuSeparatorProps extends Omit<BaseMenu.Separator.Props, "className"> {
  className?: string;
}

/** Holds a menu's open state: `open` / `defaultOpen` / `onOpenChange(open, details)`. */
export function Menu(props: MenuProps): ReactElement {
  return <BaseMenu.Root {...props} />;
}

/** Opens the menu. Render your own control: `render={<IconButton aria-label="More" … />}`. */
export function MenuTrigger(props: MenuTriggerProps): ReactElement {
  return <BaseMenu.Trigger {...props} />;
}

/**
 * The list of actions (06-component-specs.md §5): arrow keys move, typing jumps to a match, Escape
 * closes and returns focus to the trigger. It never traps Tab.
 */
export function MenuContent({
  side,
  align = "start",
  sideOffset,
  className,
  children,
  ...props
}: MenuContentProps): ReactElement {
  const inSubmenu = use(InSubmenu);
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset ?? (inSubmenu ? 0 : 4)}
        // A submenu's first item lines up with its trigger: the popup's padding plus its border.
        alignOffset={inSubmenu ? -5 : 0}
        className="qx-menu-positioner"
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

/** An action. */
export function MenuItem({
  icon: Icon,
  shortcut,
  tone,
  className,
  children,
  ...props
}: MenuItemProps): ReactElement {
  return (
    <BaseMenu.Item
      {...props}
      className={cx("qx-menu-item", className)}
      data-slot="menu-item"
      data-tone={tone}
    >
      {Icon && <Icon shape="sharp" size={16} aria-hidden className="qx-menu-item-icon" />}
      <span className="qx-menu-item-label">{children}</span>
      <Shortcut>{shortcut}</Shortcut>
    </BaseMenu.Item>
  );
}

/** An option that turns on or off; a sharp check marks it. */
export function MenuCheckboxItem({
  shortcut,
  className,
  children,
  ...props
}: MenuCheckboxItemProps): ReactElement {
  return (
    <BaseMenu.CheckboxItem
      {...props}
      className={cx("qx-menu-item", className)}
      data-slot="menu-checkbox-item"
    >
      <span className="qx-menu-mark">
        <BaseMenu.CheckboxItemIndicator className="qx-menu-mark-indicator">
          <CheckIcon shape="sharp" size={16} aria-hidden />
        </BaseMenu.CheckboxItemIndicator>
      </span>
      <span className="qx-menu-item-label">{children}</span>
      <Shortcut>{shortcut}</Shortcut>
    </BaseMenu.CheckboxItem>
  );
}

/** One choice of a MenuRadioGroup; a 6px dot marks it. */
export function MenuRadioItem({
  shortcut,
  className,
  children,
  ...props
}: MenuRadioItemProps): ReactElement {
  return (
    <BaseMenu.RadioItem
      {...props}
      className={cx("qx-menu-item", className)}
      data-slot="menu-radio-item"
    >
      <span className="qx-menu-mark">
        <BaseMenu.RadioItemIndicator className="qx-menu-mark-indicator qx-menu-dot" />
      </span>
      <span className="qx-menu-item-label">{children}</span>
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
    <InSubmenu value>
      <BaseMenu.SubmenuRoot {...props} />
    </InSubmenu>
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
      {Icon && <Icon shape="sharp" size={16} aria-hidden className="qx-menu-item-icon" />}
      <span className="qx-menu-item-label">{children}</span>
      <ChevronRightIcon shape="sharp" size={16} aria-hidden className="qx-menu-submenu-icon" />
    </BaseMenu.SubmenuTrigger>
  );
}
