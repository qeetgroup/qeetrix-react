import { storedExpression } from "../internal/storage";
import type { ColorScheme } from "./provider";

export interface ColorSchemeScriptOptions {
  /**
   * The localStorage key the choice is saved under: the same as QeetrixProvider's `storageKey`.
   * Default `qx-color-scheme`.
   */
  storageKey?: string;
  /** The scheme when nothing is saved: QeetrixProvider's `defaultColorScheme`. Default `system`. */
  defaultColorScheme?: ColorScheme;
}

/**
 * The inline script that sets `<html data-qx-color-scheme>` before the first paint, from the saved
 * choice (or the operating system's, for `system`), so a page doesn't flash the other scheme while
 * it loads. Put it in the `<head>`, before the stylesheets:
 * `<script dangerouslySetInnerHTML={{ __html: colorSchemeScript() }} />`. It's a fixed string for
 * given options, so a strict CSP can allow it by its hash. Server-safe; it needs no React.
 */
export function colorSchemeScript({
  storageKey = "qx-color-scheme",
  defaultColorScheme = "system",
}: ColorSchemeScriptOptions = {}): string {
  return (
    `(function(){var s;try{s=${storedExpression(storageKey)}}catch(e){}` +
    `if(s!=="light"&&s!=="dark"&&s!=="system")s=${JSON.stringify(defaultColorScheme)};` +
    `if(s==="system")s=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";` +
    `document.documentElement.setAttribute("data-qx-color-scheme",s)})()`
  );
}
