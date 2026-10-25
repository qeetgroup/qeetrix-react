import type { CSSProperties } from "react";

/** Text colours from the tokens; unset means the text inherits its colour. */
export type TextTone =
  | "default"
  | "subtle"
  | "subtlest"
  | "disabled"
  | "inverse"
  | "brand"
  | "danger"
  | "success"
  | "warning"
  | "info";

/** `true` for one line with an ellipsis, or a number of lines (2 or more) before clamping. */
export type Truncate = boolean | number;

/** The data attribute and line-count variable for a truncate prop. */
export function truncation(truncate: Truncate | undefined): {
  attribute: "line" | "lines" | undefined;
  style: CSSProperties | undefined;
} {
  if (truncate === undefined || truncate === false)
    return { attribute: undefined, style: undefined };
  const lines = truncate === true ? 1 : Math.max(1, Math.trunc(truncate) || 1);
  if (lines === 1) return { attribute: "line", style: undefined };
  return { attribute: "lines", style: { "--qx-text-lines": lines } as CSSProperties };
}
