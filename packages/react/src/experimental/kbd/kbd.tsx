"use client";

import { type ComponentProps, Fragment, type ReactElement, useSyncExternalStore } from "react";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { useMessages } from "../../provider/provider";
import { VisuallyHidden } from "../../visually-hidden/visually-hidden";

export type KbdSize = "sm" | "md";

export interface KbdProps extends Omit<ComponentProps<"kbd">, "children"> {
  /**
   * The shortcut: `+` joins keys pressed together ("Mod+K"), a space separates keys pressed in turn
   * ("G I"). `Mod` is Command on Apple platforms and Control elsewhere.
   */
  keys: string;
  /** `md` (default) beside body text; `sm` in dense places such as a search field. */
  size?: KbdSize;
  /** This hint's spoken key names, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["kbd"]>;
}

type Strings = QeetrixMessages["kbd"];

/** Apple platforms show symbols for modifiers; others show names. Server and hydration: not Apple. */
const isApple = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const subscribe = () => () => {};

/** A key's visible face and its spoken name. */
function face(key: string, apple: boolean, strings: Strings): { shown: string; said: string } {
  switch (key.toLowerCase()) {
    case "mod":
      return apple
        ? { shown: "⌘", said: strings.command }
        : { shown: "Ctrl", said: strings.control };
    case "ctrl":
    case "control":
      return { shown: apple ? "⌃" : "Ctrl", said: strings.control };
    case "alt":
    case "option":
      return apple ? { shown: "⌥", said: strings.option } : { shown: "Alt", said: strings.alt };
    case "shift":
      return { shown: apple ? "⇧" : "Shift", said: strings.shift };
    case "enter":
    case "return":
      return { shown: "↵", said: strings.enter };
    case "esc":
    case "escape":
      return { shown: "Esc", said: strings.escape };
    default:
      return { shown: key.length === 1 ? key.toUpperCase() : key, said: key };
  }
}

/** The ARIA form of a shortcut ("Mod+K" → "Meta+K" on Apple, "Control+K" elsewhere). */
export function ariaKeyShortcuts(keys: string, apple: boolean): string {
  return keys
    .split(" ")
    .map((chord) =>
      chord
        .split("+")
        .map((key) =>
          key.toLowerCase() === "mod"
            ? apple
              ? "Meta"
              : "Control"
            : key.length === 1
              ? key.toUpperCase()
              : key,
        )
        .join("+"),
    )
    .join(" ");
}

/** Whether this is an Apple platform, for shortcut display. False on the server and in hydration. */
export function useApplePlatform(): boolean {
  return useSyncExternalStore(subscribe, isApple, () => false);
}

/**
 * A keyboard shortcut (07-components.md, C3), shown where the action is. It only shows the keys:
 * wire the shortcut itself in the product. Each key is a `<kbd>`; screen readers hear key names
 * ("Command K"), not symbols.
 */
export function Kbd({ keys, size = "md", messages, className, ...props }: KbdProps): ReactElement {
  const strings = useMessages("kbd", messages);
  const apple = useApplePlatform();
  const steps = keys
    .trim()
    .split(/\s+/)
    .map((chord) => chord.split("+").filter(Boolean));
  return (
    <kbd {...props} className={cx("qx-kbd", className)} data-slot="kbd" data-size={size}>
      {steps.map((chord, step) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a shortcut is a fixed sequence
        <Fragment key={step}>
          {step > 0 && <VisuallyHidden>{` ${strings.sequence} `}</VisuallyHidden>}
          {chord.map((key, index) => {
            const { shown, said } = face(key, apple, strings);
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: keys of one chord, in order
              <kbd key={index} className="qx-kbd-key" data-slot="kbd-key">
                <span aria-hidden="true">{shown}</span>
                <VisuallyHidden>{index > 0 ? ` ${said}` : said}</VisuallyHidden>
              </kbd>
            );
          })}
        </Fragment>
      ))}
    </kbd>
  );
}
