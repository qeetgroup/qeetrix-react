import type { JSX, ReactNode } from "react";

/**
 * Wraps what a test renders for screenshots: 16px of page background around the component, so a
 * screenshot crops tightly to it and shows its edges, focus frames and shadows.
 */
export function Stage({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div
      data-qx-stage=""
      style={{
        display: "inline-flex",
        padding: 16,
        background: "var(--qx-color-surface-canvas)",
        color: "var(--qx-color-text-default)",
      }}
    >
      {children}
    </div>
  );
}
