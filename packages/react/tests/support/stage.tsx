import type { JSX, ReactNode } from "react";

/**
 * Wraps what a test renders for screenshots: 16px of page background around the component, so a
 * screenshot crops tightly to it and shows its edges, focus frames and shadows. It sets the body
 * typography the way an app does, since components inherit their parent's font.
 */
export function Stage({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div
      data-qx-stage=""
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        alignItems: "flex-start",
        gap: 16,
        padding: 16,
        background: "var(--qx-color-surface-canvas)",
        color: "var(--qx-color-text-default)",
        font: "var(--qx-typography-body-md)",
        fontVariationSettings: '"GEOM" var(--qx-font-geometry-body)',
      }}
    >
      {children}
    </div>
  );
}
