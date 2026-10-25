"use client";

import { type RefCallback, useCallback, useState } from "react";

/** Elements that take keyboard focus on their own. */
export const FOCUSABLE: string =
  'a[href], button, input:not([type="hidden"]), select, textarea, summary, [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])';

/**
 * Keyboard access to a region that scrolls, such as a dialog's body. When its content overflows and
 * nothing inside it can take focus, the region itself joins the tab order (tabIndex 0), so it can
 * be scrolled with the keyboard; otherwise the controls inside already scroll it into view (axe
 * `scrollable-region-focusable`). Returns a ref for the region and the tabIndex it needs.
 */
export function useScrollFocus<T extends HTMLElement>(): [RefCallback<T>, 0 | undefined] {
  const [focusable, setFocusable] = useState(false);
  const ref = useCallback<RefCallback<T>>((node) => {
    if (!node) return;
    const update = () => {
      const overflows =
        node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth;
      setFocusable(overflows && node.querySelector(FOCUSABLE) === null);
    };
    // The region keeps its size while its content grows, so watch the content too.
    const sizes = new ResizeObserver(update);
    const watch = () => {
      sizes.disconnect();
      sizes.observe(node);
      for (const child of node.children) sizes.observe(child);
    };
    const changes = new MutationObserver(() => {
      watch();
      update();
    });
    watch();
    changes.observe(node, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href", "tabindex", "contenteditable", "type"],
    });
    update();
    return () => {
      sizes.disconnect();
      changes.disconnect();
    };
  }, []);
  return [ref, focusable ? 0 : undefined];
}
