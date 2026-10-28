"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import {
  type Context,
  createContext,
  type ReactElement,
  type ReactNode,
  type RefObject,
  use,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { useMediaQuery } from "../internal/media";
import {
  DEFAULT_LOCALE,
  messages,
  type QeetrixMessages,
  type QeetrixMessagesInput,
} from "../internal/messages";
import { readStored, writeStored } from "../internal/storage";

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
   * The colour scheme, controlled. With this or `defaultColorScheme`, the provider manages the
   * scheme: it sets `data-qx-color-scheme` on `<html>`, following the operating system while it's
   * `system`, and puts back what was there when it unmounts.
   *
   * Only the outermost provider that manages the scheme owns it. A provider nested inside one
   * ignores its own `colorScheme`, `defaultColorScheme` and `onColorSchemeChange`: `useColorScheme()`
   * beneath it reads and changes the outer provider's scheme. To show one section in the other
   * scheme, set `data-qx-color-scheme` on that section's element.
   */
  colorScheme?: ColorScheme;
  /**
   * The colour scheme when uncontrolled; the provider then manages the scheme, as with
   * `colorScheme`.
   */
  defaultColorScheme?: ColorScheme;
  /** Called when `setColorScheme` asks for a change: persist it, e.g. in a cookie. */
  onColorSchemeChange?: (colorScheme: ColorScheme) => void;
  /**
   * Saves the choice in localStorage under this key and starts from it, as `colorSchemeScript`
   * reads it before the first paint: `qx-color-scheme`, say. Only for the provider that manages
   * the scheme.
   */
  storageKey?: string;
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

/** What `useColorScheme()` returns without a provider that manages the scheme. */
const UNMANAGED: ColorSchemeState = {
  colorScheme: "light",
  resolvedColorScheme: "light",
  setColorScheme: () => {},
};

const ColorSchemeContext: Context<ColorSchemeState> = createContext<ColorSchemeState>(UNMANAGED);

const ATTRIBUTE = "data-qx-color-scheme";

/**
 * The providers that own `<html data-qx-color-scheme>`: the outermost scheme-managing provider of
 * each React tree, most recent last. The last one's scheme shows. Separate trees (two roots, or two
 * sibling providers) each register, so unmounting one hands the page back to another rather than
 * clearing it.
 */
const owners: { scheme: ResolvedColorScheme }[] = [];
/** The attribute as it was before the first owner arrived, put back when the last one leaves. */
let before: string | null = null;

function writeScheme(): void {
  const html = document.documentElement;
  const value = owners.at(-1)?.scheme ?? before;
  if (value === null) html.removeAttribute(ATTRIBUTE);
  else html.setAttribute(ATTRIBUTE, value);
}

const SCHEMES: readonly string[] = ["light", "dark", "system"];

function readSaved(key: string): ColorScheme | null {
  const saved = readStored(key);
  return saved !== null && SCHEMES.includes(saved) ? (saved as ColorScheme) : null;
}

function subscribeStorage(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function ColorSchemeRoot({
  colorScheme,
  defaultColorScheme,
  onColorSchemeChange,
  storageKey,
  children,
}: {
  colorScheme: ColorScheme | undefined;
  defaultColorScheme: ColorScheme | undefined;
  onColorSchemeChange: ((colorScheme: ColorScheme) => void) | undefined;
  storageKey: string | undefined;
  children: ReactNode;
}): ReactElement {
  const [own, setOwn] = useState<ColorScheme | null>(null);
  // The saved choice (the server renders the default; colorSchemeScript has already put the saved
  // one on <html>), kept in step with other tabs.
  const saved = useSyncExternalStore(
    subscribeStorage,
    () => (storageKey ? readSaved(storageKey) : null),
    () => null,
  );
  const scheme = colorScheme ?? own ?? saved ?? defaultColorScheme ?? "system";
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)", false);
  const resolved: ResolvedColorScheme =
    scheme === "system" ? (prefersDark ? "dark" : "light") : scheme;
  // Owns the attribute while mounted; a change of scheme re-registers it as the most recent.
  useEffect(() => {
    const owner = { scheme: resolved };
    if (owners.length === 0) before = document.documentElement.getAttribute(ATTRIBUTE);
    owners.push(owner);
    writeScheme();
    return () => {
      owners.splice(owners.indexOf(owner), 1);
      writeScheme();
    };
  }, [resolved]);
  const setColorScheme = (next: ColorScheme) => {
    if (colorScheme === undefined) setOwn(next);
    if (storageKey) writeStored(storageKey, next);
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
 * App-wide settings for Qeetrix components: locale, direction, strings and the colour scheme. Nest
 * one to change a section's locale, direction or strings; it inherits whatever it doesn't set. The
 * colour scheme belongs to the outermost provider that manages it.
 */
export function QeetrixProvider({
  locale,
  direction,
  messages: strings,
  colorScheme,
  defaultColorScheme,
  onColorSchemeChange,
  storageKey,
  children,
}: QeetrixProviderProps): ReactElement {
  const outer = use(SettingsContext);
  // An enclosing provider already manages the scheme: this one doesn't fight it for <html>.
  const schemeManagedAbove = use(ColorSchemeContext) !== UNMANAGED;
  const settings: Settings = {
    locale: locale ?? outer.locale,
    messages: strings ? merge(outer.messages, strings) : outer.messages,
  };
  const directed = direction ? (
    <DirectionProvider direction={direction}>{children}</DirectionProvider>
  ) : (
    children
  );
  const managesScheme =
    !schemeManagedAbove && (colorScheme !== undefined || defaultColorScheme !== undefined);
  return (
    <SettingsContext value={settings}>
      {managesScheme ? (
        <ColorSchemeRoot
          colorScheme={colorScheme}
          defaultColorScheme={defaultColorScheme}
          onColorSchemeChange={onColorSchemeChange}
          storageKey={storageKey}
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
 * The colour scheme, and a way to change it, from the outermost QeetrixProvider that manages it (one
 * with `colorScheme` or `defaultColorScheme`). Without one, it reports `light` and can't change it.
 */
export function useColorScheme(): ColorSchemeState {
  return use(ColorSchemeContext);
}

/**
 * Whether a QeetrixProvider above manages the colour scheme, so `setColorScheme` changes it.
 * Internal: ThemeSwitcher warns in development when there's nothing for it to switch.
 */
export function useColorSchemeManaged(): boolean {
  return use(ColorSchemeContext) !== UNMANAGED;
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

/** Where popups render: an element, a shadow root, or a ref to one. */
export type PortalContainerTarget =
  | HTMLElement
  | ShadowRoot
  | RefObject<HTMLElement | ShadowRoot | null>
  | null;

const PortalContext: Context<PortalContainerTarget | undefined> = createContext<
  PortalContainerTarget | undefined
>(undefined);

export interface PortalContainerProps {
  /** The element the popups inside render into: a native `<dialog>`, say, or its ref. */
  container: PortalContainerTarget;
  children?: ReactNode;
}

/**
 * Renders the popups inside it (menus, popovers, selects, tooltips, comboboxes, dialogs) into
 * `container` instead of the body: inside a native modal `<dialog>`, which makes the rest of the
 * page inert, a shadow root or another top-layer element.
 */
export function PortalContainer({ container, children }: PortalContainerProps): ReactElement {
  return <PortalContext value={container}>{children}</PortalContext>;
}

/** The nearest PortalContainer's target; `undefined` (the body) without one. Internal. */
export function usePortalContainer(): PortalContainerTarget | undefined {
  return use(PortalContext);
}
