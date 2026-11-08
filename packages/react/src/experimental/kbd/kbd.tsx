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
   *
   * Named keys take `KeyboardEvent.key`'s names, in any case, so the string that wires a shortcut
   * also shows it. Shown / spoken, with Apple's face after the slash where it differs:
   * `Mod` ⌘ Command / Ctrl Control · `Ctrl` ⌃ / Ctrl · `Alt` ⌥ Option / Alt · `Shift` ⇧ / Shift ·
   * `Enter` ↵ · `Escape` Esc · `ArrowLeft` ← · `ArrowRight` → · `ArrowUp` ↑ · `ArrowDown` ↓ (each spoken
   * "Left arrow" and so on) · `Tab` ⇥ / Tab · `Space` (or `Spacebar`) Space · `Backspace` ⌫ Delete /
   * Backspace · `Delete` (or `Del`) ⌦ Forward Delete / Del · `Home` ↖ / Home · `End` ↘ / End ·
   * `PageUp` ⇞ / PgUp · `PageDown` ⇟ / PgDn. Any other single character shows in capitals; any other
   * name as written. An arrow is the key itself: where "next" follows the reading direction, pass
   * `ArrowLeft` in right-to-left layouts.
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
    case "arrowleft":
      return { shown: "←", said: strings.arrowLeft };
    case "arrowright":
      return { shown: "→", said: strings.arrowRight };
    case "arrowup":
      return { shown: "↑", said: strings.arrowUp };
    case "arrowdown":
      return { shown: "↓", said: strings.arrowDown };
    case "tab":
      return { shown: apple ? "⇥" : "Tab", said: strings.tab };
    case "space":
    case "spacebar":
      return { shown: "Space", said: strings.space };
    // Apple keyboards call Backspace "delete" and Delete "forward delete".
    case "backspace":
      return apple
        ? { shown: "⌫", said: strings.delete }
        : { shown: "Backspace", said: strings.backspace };
    case "delete":
    case "del":
      return apple
        ? { shown: "⌦", said: strings.forwardDelete }
        : { shown: "Del", said: strings.delete };
    case "home":
      return { shown: apple ? "↖" : "Home", said: strings.home };
    case "end":
      return { shown: apple ? "↘" : "End", said: strings.end };
    case "pageup":
      return { shown: apple ? "⇞" : "PgUp", said: strings.pageUp };
    case "pagedown":
      return { shown: apple ? "⇟" : "PgDn", said: strings.pageDown };
    default:
      return { shown: key.length === 1 ? key.toUpperCase() : key, said: key };
  }
}

/** `KeyboardEvent.key`'s spelling of the named keys, by their lower-case form. */
const keyNames: Record<string, string> = {
  ctrl: "Control",
  control: "Control",
  alt: "Alt",
  option: "Alt",
  shift: "Shift",
  enter: "Enter",
  return: "Enter",
  esc: "Escape",
  escape: "Escape",
  arrowleft: "ArrowLeft",
  arrowright: "ArrowRight",
  arrowup: "ArrowUp",
  arrowdown: "ArrowDown",
  tab: "Tab",
  space: "Space",
  spacebar: "Space",
  backspace: "Backspace",
  delete: "Delete",
  del: "Delete",
  home: "Home",
  end: "End",
  pageup: "PageUp",
  pagedown: "PageDown",
};

/** The ARIA form of a shortcut ("Mod+K" → "Meta+K" on Apple, "Control+K" elsewhere). */
export function ariaKeyShortcuts(keys: string, apple: boolean): string {
  return keys
    .split(" ")
    .map((chord) =>
      chord
        .split("+")
        .map((key) => {
          const lower = key.toLowerCase();
          if (lower === "mod") return apple ? "Meta" : "Control";
          if (key.length === 1) return key.toUpperCase();
          return keyNames[lower] ?? key;
        })
        .join("+"),
    )
    .join(" ");
}

/** Whether this is an Apple platform, for shortcut display. False on the server and in hydration. */
export function useApplePlatform(): boolean {
  return useSyncExternalStore(subscribe, isApple, () => false);
}

/** One face of a key: what shows, and what's said. */
function Face({
  shown,
  said,
  platform,
}: {
  shown: string;
  said: string;
  platform?: "apple" | "other";
}): ReactElement {
  return (
    <span className="qx-kbd-face" data-platform={platform}>
      <span aria-hidden="true">{shown}</span>
      <VisuallyHidden>{said}</VisuallyHidden>
    </span>
  );
}

/**
 * A keyboard shortcut (07-components.md, C3), shown where the action is. It only shows the keys:
 * wire the shortcut itself in the product. Each key is a `<kbd>`; screen readers hear key names
 * ("Command K"), not symbols.
 */
export function Kbd({ keys, size = "md", messages, className, ...props }: KbdProps): ReactElement {
  const strings = useMessages("kbd", messages);
  // A key whose face differs by platform (Mod, Alt, Shift…) renders both, and the stylesheet shows
  // one: Apple's where <html data-qx-platform="apple"> (colorSchemeScript sets it before the first
  // paint, and on a page that never runs React), or where this Kbd's data-platform says so once
  // React has. The markup is the same on the server and the client.
  const apple = useApplePlatform();
  const steps = keys
    .trim()
    .split(/\s+/)
    .map((chord) => chord.split("+").filter(Boolean));
  return (
    <kbd
      {...props}
      className={cx("qx-kbd", className)}
      data-slot="kbd"
      data-size={size}
      data-platform={apple ? "apple" : undefined}
    >
      {steps.map((chord, step) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a shortcut is a fixed sequence
        <Fragment key={step}>
          {step > 0 && <VisuallyHidden>{` ${strings.sequence} `}</VisuallyHidden>}
          {chord.map((key, index) => {
            const other = face(key, false, strings);
            const mac = face(key, true, strings);
            const lead = index > 0 ? " " : "";
            const same = other.shown === mac.shown && other.said === mac.said;
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: keys of one chord, in order
              <kbd key={index} className="qx-kbd-key" data-slot="kbd-key">
                {same ? (
                  <Face shown={other.shown} said={lead + other.said} />
                ) : (
                  <>
                    <Face shown={other.shown} said={lead + other.said} platform="other" />
                    <Face shown={mac.shown} said={lead + mac.said} platform="apple" />
                  </>
                )}
              </kbd>
            );
          })}
        </Fragment>
      ))}
    </kbd>
  );
}
