"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether a media query matches, kept in sync as it changes. On the server, and in the first client
 * render, it's `serverValue`, so server and client markup agree.
 */
export function useMediaQuery(query: string, serverValue: boolean): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
