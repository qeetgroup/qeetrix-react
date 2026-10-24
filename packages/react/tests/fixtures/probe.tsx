import type { JSX } from "react";

/**
 * A test-only component that proves the platform end to end — browser rendering, keyboard focus,
 * axe, screenshots and the density switch — before any real component exists. Its height is the
 * density-dependent control height. Never exported from the package.
 */
export function Probe({ label = "Save changes" }: { label?: string }): JSX.Element {
  return (
    <button
      type="button"
      className="qx-probe"
      data-slot="probe"
      style={{
        height: "var(--qx-size-control-md)",
        paddingInline: "var(--qx-space-inset-md)",
        border: "var(--qx-border-width-default) solid var(--qx-color-border-strong)",
        borderRadius: "var(--qx-radius-control)",
        background: "var(--qx-color-surface-raised)",
        color: "var(--qx-color-text-default)",
      }}
    >
      {label}
    </button>
  );
}
