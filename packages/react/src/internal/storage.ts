/**
 * The one module that touches localStorage, for the few parts that remember a choice by a key the
 * product gives (QeetrixProvider's `storageKey`, FloatingPanel's). Guarded for the server and for
 * storage that's off (private modes, a policy): reading gives `null`, writing does nothing.
 */
export function readStored(key: string): string | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage is off: the choice lasts for this page.
  }
}

/** The expression an inline script reads a stored value with, inside its own try. */
export const storedExpression = (key: string): string =>
  `localStorage.getItem(${JSON.stringify(key)})`;
