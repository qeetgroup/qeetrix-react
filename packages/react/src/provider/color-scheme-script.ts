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
  /**
   * Keep following the operating system while the saved choice is `system`, for a page that runs
   * no React (a static site's chrome): QeetrixProvider follows it itself once it mounts. A choice
   * saved later under `storageKey` is read on each change, so a light or dark choice holds.
   * Default `false`.
   */
  followSystem?: boolean;
}

/**
 * The inline script that sets `<html data-qx-color-scheme>` before the first paint, from the saved
 * choice (or the operating system's, for `system`), so a page doesn't flash the other scheme while
 * it loads. On Apple platforms it also sets `<html data-qx-platform="apple">`, so Kbd shows ⌘ ⌥ ⇧
 * before React runs, or on a page without it. Put it in the `<head>`, before the stylesheets:
 * `<script dangerouslySetInnerHTML={{ __html: colorSchemeScript() }} />`. It's a fixed string for
 * given options, so a strict CSP can allow it by its hash. Server-safe; it needs no React.
 */
export function colorSchemeScript({
  storageKey = "qx-color-scheme",
  defaultColorScheme = "system",
  followSystem = false,
}: ColorSchemeScriptOptions = {}): string {
  return (
    `(function(){var d=document.documentElement,m=matchMedia("(prefers-color-scheme: dark)");` +
    `function a(){var s;try{s=${storedExpression(storageKey)}}catch(e){}` +
    `if(s!=="light"&&s!=="dark"&&s!=="system")s=${JSON.stringify(defaultColorScheme)};` +
    `if(s==="system")s=m.matches?"dark":"light";` +
    `d.setAttribute("data-qx-color-scheme",s)}a();` +
    "if(/Mac|iPhone|iPad/.test(navigator.platform||navigator.userAgent))" +
    `d.setAttribute("data-qx-platform","apple");` +
    (followSystem ? `m.addEventListener("change",a);` : "") +
    "})()"
  );
}
