"use client";

import { type RefObject, useEffect, useState } from "react";

/** The elements that label a control: those its `aria-labelledby` names, else its `<label>`s. */
function labelsOf(control: HTMLElement): HTMLElement[] {
  const ids = control.getAttribute("aria-labelledby")?.trim().split(/\s+/) ?? [];
  const named = ids
    .map((id) => control.ownerDocument.getElementById(id))
    .filter((element): element is HTMLElement => element !== null);
  if (named.length > 0 || control.getAttribute("aria-label")) return named;
  return [...((control as HTMLInputElement).labels ?? [])];
}

/**
 * The words that name a form control, as assistive technology reads its label: the elements its
 * `aria-labelledby` points to, else its `aria-label`, else its `<label>`s. Field's "(optional)" is
 * left out. "" when it has none.
 */
export function labelTextOf(control: HTMLElement): string {
  const labels = labelsOf(control);
  if (labels.length === 0) return (control.getAttribute("aria-label") ?? "").trim();
  return labels
    .map((label) => {
      const copy = label.cloneNode(true) as HTMLElement;
      for (const extra of copy.querySelectorAll('[data-slot="field-optional"]')) extra.remove();
      return copy.textContent ?? "";
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The label text of the control in `ref`, kept up to date as its label changes (a Field wiring it
 * up, a language switch). "" on the server and in the first render.
 */
export function useLabelText(ref: RefObject<HTMLElement | null>): string {
  const [text, setText] = useState("");
  useEffect(() => {
    const control = ref.current;
    if (!control) return;
    // Watch the control's naming attributes and its labels' text; on a change, read and re-watch.
    const observer = new MutationObserver(() => watch());
    const watch = () => {
      observer.disconnect();
      setText(labelTextOf(control));
      observer.observe(control, {
        attributes: true,
        attributeFilter: ["aria-label", "aria-labelledby", "id"],
      });
      for (const label of labelsOf(control)) {
        observer.observe(label, { subtree: true, childList: true, characterData: true });
      }
    };
    watch();
    return () => observer.disconnect();
  }, [ref]);
  return text;
}
