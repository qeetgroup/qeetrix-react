import type { JSX } from "react";

/**
 * A test-only component that proves the platform end to end — browser rendering, keyboard focus,
 * axe and screenshots — before any real component exists. Never exported from the package.
 */
export function Probe({ label = "Save changes" }: { label?: string }): JSX.Element {
  return (
    <button type="button" className="qx-probe" data-slot="probe">
      {label}
    </button>
  );
}
