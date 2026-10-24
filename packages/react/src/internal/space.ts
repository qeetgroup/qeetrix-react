/**
 * The space scale shared by Box, Stack, Inline and Grid: none, then the gap tokens (xs–xl), then the
 * layout tokens (2xl–4xl). 0 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64px.
 */
export type Space = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

/** Padding inside a surface: the inset tokens. 0 · 4 · 8 · 12 · 16 · 24px. */
export type Inset = "none" | "xs" | "sm" | "md" | "lg" | "xl";

/** Text alignment, in logical directions so it follows right-to-left layouts. */
export type TextAlign = "start" | "center" | "end";
