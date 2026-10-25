"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import {
  type Context,
  createContext,
  type ReactElement,
  type ReactNode,
  use,
  useEffect,
  useState,
} from "react";
import { useMediaQuery } from "../internal/media";
import {
  DEFAULT_LOCALE,
  messages,
  type QeetrixMessages,
  type QeetrixMessagesInput,
} from "../internal/messages";

export type Direction = "ltr" | "rtl";
export type ColorScheme = "light" | "dark" | "system";
export type ResolvedColorScheme = "light" | "dark";

export interface QeetrixProviderProps {
  /** A BCP 47 locale for formatting, e.g. `hi-IN`. Default `en-IN`, or the enclosing provider's. */
  locale?: string;
  /**
   * The reading direction, for arrow keys, submenus, sliders and drawers. Default `ltr`, or the
   * enclosing provider's. Set `dir` on `<html>` too: this doesn't render an element.
   */
  direction?: Direction;
  /** A locale pack (`@qeetrix/react/locales/hi`) or any subset of the strings. */
  messages?: QeetrixMessagesInput;
  /**
   * The colour scheme, controlled. With this or `defaultColorScheme`, the provider sets
   * `data-qx-color-scheme` on `<html>`, following the operating system while it's `system`.
   */
  colorScheme?: ColorScheme;
  /** The colour scheme when uncontrolled. */
  defaultColorScheme?: ColorScheme;
  /** Called when `setColorScheme` asks for a change: persist it, e.g. in a cookie. */
  onColorSchemeChange?: (colorScheme: ColorScheme) => void;
  children?: ReactNode;
}

export interface ColorSchemeState {
  /** The chosen scheme, `system` included. */
  colorScheme: ColorScheme;
  /** What's showing: `light` or `dark`. */
  resolvedColorScheme: ResolvedColorScheme;
  /** Choose a scheme. */
  setColorScheme: (colorScheme: ColorScheme) => void;
}

interface Settings {
  locale: string;
  messages: QeetrixMessagesInput;
}

const SettingsContext: Context<Settings> = createContext<Settings>({
  locale: DEFAULT_LOCALE,
  messages: {},
});

const ColorSchemeContext: Context<ColorSchemeState> = createContext<ColorSchemeState>({
  colorScheme: "light",
  resolvedColorScheme: "light",
  setColorScheme: () => {},
});

function ColorSchemeRoot({
  colorScheme,
  defaultColorScheme,
  onColorSchemeChange,
  children,
}: {
  colorScheme: ColorScheme | undefined;
  defaultColorScheme: ColorScheme | undefined;
  onColorSchemeChange: ((colorScheme: ColorScheme) => void) | undefined;
  children: ReactNode;
}): ReactElement {
  const [own, setOwn] = useState<ColorScheme>(defaultColorScheme ?? "system");
  const scheme = colorScheme ?? own;
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)", false);
  const resolved: ResolvedColorScheme =
    scheme === "system" ? (prefersDark ? "dark" : "light") : scheme;
  useEffect(() => {
    document.documentElement.dataset.qxColorScheme = resolved;
  }, [resolved]);
  const setColorScheme = (next: ColorScheme) => {
    if (colorScheme === undefined) setOwn(next);
    onColorSchemeChange?.(next);
  };
  return (
    <ColorSchemeContext
      value={{ colorScheme: scheme, resolvedColorScheme: resolved, setColorScheme }}
    >
      {children}
    </ColorSchemeContext>
  );
}

function merge(outer: QeetrixMessagesInput, inner: QeetrixMessagesInput): QeetrixMessagesInput {
  const out: Record<string, object> = { ...outer };
  for (const [group, strings] of Object.entries(inner)) {
    out[group] = { ...out[group], ...strings };
  }
  return out as QeetrixMessagesInput;
}

/**
 * App-wide settings for Qeetrix components: locale, direction and strings. Nest one to change a
 * section; it inherits whatever it doesn't set.
 */
export function QeetrixProvider({
  locale,
  direction,
  messages: strings,
  colorScheme,
  defaultColorScheme,
  onColorSchemeChange,
  children,
}: QeetrixProviderProps): ReactElement {
  const outer = use(SettingsContext);
  const settings: Settings = {
    locale: locale ?? outer.locale,
    messages: strings ? merge(outer.messages, strings) : outer.messages,
  };
  const directed = direction ? (
    <DirectionProvider direction={direction}>{children}</DirectionProvider>
  ) : (
    children
  );
  const managesScheme = colorScheme !== undefined || defaultColorScheme !== undefined;
  return (
    <SettingsContext value={settings}>
      {managesScheme ? (
        <ColorSchemeRoot
          colorScheme={colorScheme}
          defaultColorScheme={defaultColorScheme}
          onColorSchemeChange={onColorSchemeChange}
        >
          {directed}
        </ColorSchemeRoot>
      ) : (
        directed
      )}
    </SettingsContext>
  );
}

/**
 * The colour scheme, and a way to change it, from the QeetrixProvider that manages it (one with
 * `colorScheme` or `defaultColorScheme`).
 */
export function useColorScheme(): ColorSchemeState {
  return use(ColorSchemeContext);
}

/** The locale set by the nearest QeetrixProvider; `en-IN` without one. */
export function useLocale(): string {
  return use(SettingsContext).locale;
}

/** A component's strings: its own prop, then the provider, then the English defaults. */
export function useMessages<Group extends keyof QeetrixMessages>(
  group: Group,
  own?: Partial<QeetrixMessages[Group]>,
): QeetrixMessages[Group] {
  const provided = use(SettingsContext).messages[group];
  return { ...messages[group], ...provided, ...own } as QeetrixMessages[Group];
}
