"use client";

import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { IconProps } from "@qeetrix/icons";
import type { ComponentType, CSSProperties, ReactElement, ReactNode } from "react";
import { Badge } from "../badge/badge";
import { formatNumber } from "../format/format";
import type { QeetrixIcon } from "../internal/control";
import { cx } from "../internal/cx";
import { useLocale } from "../provider/provider";

/**
 * `line`: tabs over a 2px rule, the selected one marked by the Ember bar. `contained`: a joined,
 * ruled strip of segments on a neutral fill, the selected one on the page surface with the bar.
 */
export type TabsVariant = "line" | "contained";

export interface TabsProps extends Omit<BaseTabs.Root.Props, "className" | "style"> {
  /** Placement only. */
  className?: string;
  style?: CSSProperties;
}

export interface TabsListProps extends Omit<BaseTabs.List.Props, "className" | "style"> {
  /** Select a tab as soon as it takes focus; turn it off when panels load slowly. Default `true`. */
  activateOnFocus?: boolean;
  /**
   * The look: `line`, tabs over a rule, for the views of a page; `contained`, a segmented strip, for
   * a few views of one panel or card. Default `line`.
   */
  variant?: TabsVariant;
  className?: string;
  style?: CSSProperties;
}

export interface TabProps extends Omit<BaseTabs.Tab.Props, "className" | "style" | "children"> {
  /** A leading 16px icon from `@qeetrix/icons`, sharp. */
  icon?: QeetrixIcon;
  /** Show the icon's filled drawing while selected. Only for icons that have one. */
  filledWhenSelected?: boolean;
  /** The label. */
  children?: ReactNode;
  /**
   * A trailing count, on the label's baseline: a number is formatted for the locale and shown as a
   * neutral Badge; or pass your own Badge, e.g. `<Badge tone="danger">3</Badge>`.
   */
  badge?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export interface TabsPanelProps extends Omit<BaseTabs.Panel.Props, "className" | "style"> {
  className?: string;
  style?: CSSProperties;
}

/**
 * Views of the same context: `value` / `defaultValue` / `onValueChange(value, details)`, and
 * `orientation`.
 */
export function Tabs({ className, ...props }: TabsProps): ReactElement {
  return <BaseTabs.Root {...props} className={cx("qx-tabs", className)} data-slot="tabs" />;
}

/**
 * The tabs, one tab stop: arrow keys move between them, Home and End jump. It draws the Ember bar
 * under the selected tab, and the bar slides when the selection changes.
 */
export function TabsList({
  activateOnFocus = true,
  variant = "line",
  className,
  children,
  ...props
}: TabsListProps): ReactElement {
  return (
    <BaseTabs.List
      {...props}
      activateOnFocus={activateOnFocus}
      className={cx("qx-tabs-list", className)}
      data-slot="tabs-list"
      data-variant={variant}
    >
      {children}
      <BaseTabs.Indicator className="qx-tabs-indicator" data-slot="tabs-indicator" />
    </BaseTabs.List>
  );
}

/** One tab: a label, and optionally a leading icon that fills when selected and a trailing count. */
export function Tab({
  icon: Icon,
  filledWhenSelected,
  badge,
  className,
  children,
  ...props
}: TabProps): ReactElement {
  const locale = useLocale();
  const Filled = Icon as ComponentType<IconProps> | undefined;
  return (
    <BaseTabs.Tab {...props} className={cx("qx-tab", className)} data-slot="tab">
      {Icon && (
        <Icon shape="sharp" size={16} aria-hidden className="qx-tab-icon qx-tab-icon-outline" />
      )}
      {Filled && filledWhenSelected && (
        <Filled
          shape="sharp"
          variant="filled"
          size={16}
          aria-hidden
          className="qx-tab-icon qx-tab-icon-filled"
        />
      )}
      {/* The label and its count on one baseline, so a 12px count doesn't sit 2px high. */}
      <span className="qx-tab-label" data-slot="tab-label">
        {children}
        {badge != null && (
          <span className="qx-tab-badge" data-slot="tab-badge">
            {typeof badge === "number" ? <Badge>{formatNumber(badge, locale)}</Badge> : badge}
          </span>
        )}
      </span>
    </BaseTabs.Tab>
  );
}

/** The content for one tab's `value`; it follows the tab list in the Tab order. */
export function TabsPanel({ className, ...props }: TabsPanelProps): ReactElement {
  return (
    <BaseTabs.Panel {...props} className={cx("qx-tabs-panel", className)} data-slot="tabs-panel" />
  );
}
