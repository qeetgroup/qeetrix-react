"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import { CheckIcon } from "@qeetrix/icons/icons/check";
import { MonitorIcon } from "@qeetrix/icons/icons/monitor";
import { MoonIcon } from "@qeetrix/icons/icons/moon";
import { SunIcon } from "@qeetrix/icons/icons/sun";
import { type ComponentProps, type ReactElement, useEffect, useState } from "react";
import { IconButton } from "../../button/button";
import type { ControlSize, QeetrixIcon } from "../../internal/control";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { Menu, MenuContent, MenuTrigger } from "../../menu/menu";
import {
  type ColorScheme,
  useColorScheme,
  useColorSchemeManaged,
  useMessages,
} from "../../provider/provider";
import { Toggle, ToggleGroup } from "../../toggle/toggle";
import type { TooltipProps } from "../../tooltip/tooltip";

/** `menu`: an icon button that opens the three choices. `segmented`: the three choices in a row. */
export type ThemeSwitcherVariant = "menu" | "segmented";

/** The choices in order, each with its sharp icon. */
const SCHEMES: readonly { scheme: ColorScheme; icon: QeetrixIcon }[] = [
  { scheme: "light", icon: SunIcon },
  { scheme: "dark", icon: MoonIcon },
  { scheme: "system", icon: MonitorIcon },
];

const iconOf = (scheme: ColorScheme): QeetrixIcon =>
  scheme === "dark" ? MoonIcon : scheme === "system" ? MonitorIcon : SunIcon;

const isScheme = (value: unknown): value is ColorScheme =>
  value === "light" || value === "dark" || value === "system";

interface ThemeSwitcherOwnProps {
  /**
   * The chosen scheme, controlled. With this or `defaultValue` the switcher keeps its own value and
   * leaves QeetrixProvider alone; without either, it reads and sets the provider's scheme.
   */
  value?: ColorScheme;
  /** The scheme it starts on when uncontrolled; detaches it from QeetrixProvider, as `value` does. */
  defaultValue?: ColorScheme;
  /**
   * Called with the new scheme when a different one is chosen; never with the current one. While
   * the switcher follows QeetrixProvider, it's called as well as the provider's
   * `onColorSchemeChange`.
   */
  onValueChange?: (value: ColorScheme) => void;
  /** Height from the density tokens, as on IconButton and ToggleGroup. Default `md`. */
  size?: ControlSize;
  /** Disable it. A disabled menu trigger stays focusable, as Button does. */
  disabled?: boolean;
  /** The side its tooltips open on. Default `top`; they flip when there is no room. */
  tooltipSide?: TooltipProps["side"];
  /** This switcher's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["themeSwitcher"]>;
}

export interface ThemeSwitcherMenuProps
  extends ThemeSwitcherOwnProps,
    Omit<ComponentProps<"button">, keyof ThemeSwitcherOwnProps | "children" | "onChange"> {
  /**
   * `menu` (default): a neutral ghost IconButton showing the current choice's icon, named by the
   * `label` string ("Theme"), which opens Light, Dark and System; an Ember check marks the current
   * one.
   */
  variant?: "menu";
  /** The side the menu opens on: `top` at a page's or navigation's foot. Default `bottom`. */
  menuSide?: "top" | "bottom";
}

export interface ThemeSwitcherSegmentedProps
  extends ThemeSwitcherOwnProps,
    Omit<ComponentProps<"div">, keyof ThemeSwitcherOwnProps | "children" | "onChange" | "dir"> {
  /**
   * `segmented`: a ToggleGroup of three icon-only toggles, Light, Dark and System, named by the
   * `label` string; each shows its name as a tooltip.
   */
  variant: "segmented";
}

export type ThemeSwitcherProps = ThemeSwitcherMenuProps | ThemeSwitcherSegmentedProps;

/**
 * The scheme on show and a way to choose another: the switcher's own (controlled or not), or the
 * enclosing QeetrixProvider's.
 */
function useChoice(
  value: ColorScheme | undefined,
  defaultValue: ColorScheme | undefined,
  onValueChange: ((value: ColorScheme) => void) | undefined,
): [ColorScheme, (next: ColorScheme) => void] {
  const provider = useColorScheme();
  const managed = useColorSchemeManaged();
  const [own, setOwn] = useState<ColorScheme>(defaultValue ?? "system");
  const follows = value === undefined && defaultValue === undefined;
  const current = value ?? (follows ? provider.colorScheme : own);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && follows && !managed) {
      console.warn(
        "Qeetrix: ThemeSwitcher has no QeetrixProvider that manages the colour scheme. Give the " +
          "provider `defaultColorScheme` (or `colorScheme`), or control the switcher with `value` " +
          "and `onValueChange`.",
      );
    }
  }, [follows, managed]);
  const choose = (next: ColorScheme) => {
    // Choosing the current scheme again changes nothing, and never leaves nothing chosen.
    if (next === current) return;
    if (follows) provider.setColorScheme(next);
    else if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };
  return [current, choose];
}

function ThemeMenu({
  value,
  defaultValue,
  onValueChange,
  size = "md",
  disabled = false,
  tooltipSide = "top",
  messages,
  variant: _variant,
  menuSide = "bottom",
  className,
  ...props
}: ThemeSwitcherMenuProps): ReactElement {
  const strings = useMessages("themeSwitcher", messages);
  const [current, choose] = useChoice(value, defaultValue, onValueChange);
  return (
    <Menu>
      <MenuTrigger
        disabled={disabled}
        render={
          <IconButton
            {...props}
            aria-label={props["aria-label"] ?? strings.label}
            variant="ghost"
            tone="neutral"
            size={size}
            icon={iconOf(current)}
            disabled={disabled}
            tooltipSide={tooltipSide}
            className={cx("qx-theme-switcher", className)}
          />
        }
      />
      <MenuContent align="end" side={menuSide} className="qx-theme-switcher-menu">
        <BaseMenu.RadioGroup
          value={current}
          onValueChange={(next: unknown) => {
            if (isScheme(next)) choose(next);
          }}
        >
          {SCHEMES.map(({ scheme, icon: Icon }) => (
            <BaseMenu.RadioItem
              key={scheme}
              value={scheme}
              closeOnClick
              className="qx-menu-item qx-theme-switcher-option"
              data-slot="theme-switcher-option"
            >
              <Icon
                shape="sharp"
                size={16}
                aria-hidden
                className="qx-menu-item-icon"
                data-slot="menu-item-icon"
              />
              <span className="qx-menu-item-label" data-slot="menu-item-label">
                {strings[scheme]}
              </span>
              {/* The check's column is always there, so the menu keeps its width. */}
              <span className="qx-menu-mark" data-slot="menu-item-mark">
                <BaseMenu.RadioItemIndicator className="qx-menu-mark-indicator">
                  <CheckIcon shape="sharp" size={16} aria-hidden />
                </BaseMenu.RadioItemIndicator>
              </span>
            </BaseMenu.RadioItem>
          ))}
        </BaseMenu.RadioGroup>
      </MenuContent>
    </Menu>
  );
}

function ThemeSegmented({
  value,
  defaultValue,
  onValueChange,
  size = "md",
  disabled = false,
  tooltipSide = "top",
  messages,
  variant: _variant,
  className,
  ...props
}: ThemeSwitcherSegmentedProps): ReactElement {
  const strings = useMessages("themeSwitcher", messages);
  const [current, choose] = useChoice(value, defaultValue, onValueChange);
  return (
    <ToggleGroup
      aria-label={strings.label}
      {...props}
      // Always the current scheme: pressing it again would release it, so that change is ignored.
      value={[current]}
      onValueChange={(values) => {
        const next = values[0];
        if (isScheme(next)) choose(next);
      }}
      variant="segmented"
      size={size}
      disabled={disabled}
      className={cx("qx-theme-switcher", className)}
    >
      {SCHEMES.map(({ scheme, icon }) => (
        <Toggle
          key={scheme}
          value={scheme}
          icon={icon}
          filledWhenPressed
          size={size}
          aria-label={strings[scheme]}
          tooltipSide={tooltipSide}
        />
      ))}
    </ToggleGroup>
  );
}

/**
 * Light, dark or the system's colour scheme, the same switch in every product: the menu variant,
 * at the foot of the navigation or the page, is the one Qeet products use. By default it follows
 * the enclosing QeetrixProvider (`useColorScheme`), which saves the choice for
 * `colorSchemeScript` with `storageKey="qx-color-scheme"`; System keeps following the device. Give
 * it `value` and `onValueChange` to manage the scheme yourself. `variant="menu"` (default) is an icon button with a menu of the three;
 * `variant="segmented"` shows them as three icon-only toggles. One is always chosen.
 */
export function ThemeSwitcher(props: ThemeSwitcherProps): ReactElement {
  return props.variant === "segmented" ? <ThemeSegmented {...props} /> : <ThemeMenu {...props} />;
}
