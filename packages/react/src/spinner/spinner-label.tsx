"use client";

import type { ReactElement } from "react";
import { useMessages } from "../provider/provider";

/**
 * Spinner's name from QeetrixProvider's strings. Spinner itself stays server-safe; only this hidden
 * text reads the provider, and the spinner points at it with `aria-labelledby`.
 */
export function SpinnerLabel({ id }: { id: string }): ReactElement {
  const { label } = useMessages("spinner");
  return (
    <span id={id} hidden data-slot="spinner-label">
      {label}
    </span>
  );
}
