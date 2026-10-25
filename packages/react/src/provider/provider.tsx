"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type Context, createContext, type ReactElement, type ReactNode, use } from "react";
import {
  DEFAULT_LOCALE,
  messages,
  type QeetrixMessages,
  type QeetrixMessagesInput,
} from "../internal/messages";

export type Direction = "ltr" | "rtl";

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
  children?: ReactNode;
}

interface Settings {
  locale: string;
  messages: QeetrixMessagesInput;
}

const SettingsContext: Context<Settings> = createContext<Settings>({
  locale: DEFAULT_LOCALE,
  messages: {},
});

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
  children,
}: QeetrixProviderProps): ReactElement {
  const outer = use(SettingsContext);
  const settings: Settings = {
    locale: locale ?? outer.locale,
    messages: strings ? merge(outer.messages, strings) : outer.messages,
  };
  return (
    <SettingsContext value={settings}>
      {direction ? (
        <DirectionProvider direction={direction}>{children}</DirectionProvider>
      ) : (
        children
      )}
    </SettingsContext>
  );
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
