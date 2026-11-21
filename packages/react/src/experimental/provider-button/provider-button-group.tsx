"use client";

import {
  Children,
  type ComponentProps,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cx } from "../../internal/cx";
import { mergeRefs } from "../../internal/refs";
import { ProviderButtonLabelsHidden } from "./provider-button-context";

/**
 * How a ProviderButtonGroup shows its providers' names: beside their logos, hidden (the logo-only
 * form), or hidden only while a cell is too narrow for its name.
 */
export type ProviderButtonLabels = "visible" | "hidden" | "auto";

export interface ProviderButtonGroupProps extends Omit<ComponentProps<"fieldset">, "aria-label"> {
  /**
   * Required: what the buttons are for, e.g. "Sign in with another account". The group shows no
   * legend, so this names it.
   */
  "aria-label": string;
  /**
   * The providers' names. Default `"auto"`: each beside its logo while every name fits its cell, and
   * the logo-only form once one doesn't, so no name is ever cut short. In a 400px sign-in column
   * that is up to three providers; a fourth, or a phone's narrower row, takes the logos alone. The
   * whole group changes together. It measures in the browser, so a server-rendered page shows the
   * names until it hydrates.
   *
   * - `"hidden"`: always the logo-only form. Each logo is drawn alone at 24px (`size.icon.lg`),
   *   centred in its cell, which keeps the field height. The name is hidden from sight only: each
   *   button is still named by its `aria-label`, which shows in a tooltip on hover and keyboard
   *   focus, not on touch.
   * - `"visible"`: always the names, cut short with an ellipsis where a cell is too narrow.
   */
  labels?: ProviderButtonLabels | undefined;
  /**
   * ProviderButtons, one per provider, each in an equal cell. Put even a single provider in a
   * group: the group draws the surface, the border and the rules. Up to six share one row; past
   * six they wrap into balanced rows (seven as four and three), so a cell stays at least 44px wide
   * in a 320px column.
   */
  children?: ReactNode;
}

/** The most providers that share one row: six keeps each cell 44px wide or more at 320px. */
const ROW = 6;

/**
 * The ruled row of sign-in providers ("Continue with Google, Microsoft, Apple"): a `<fieldset>`
 * named by its `aria-label`, on the raised surface, with a 1px border, 4px corners and 1px rules
 * between equal cells. The whole row is the field height (`size.control.lg`), so it lines up with a
 * form's fields and its main button. A row too narrow for its names shows the logos alone
 * (`labels`), and more than six providers wrap into balanced rows, ruled between them too.
 */
export function ProviderButtonGroup({
  labels = "auto",
  className,
  ref,
  children,
  ...props
}: ProviderButtonGroupProps): ReactElement {
  const group = useRef<HTMLFieldSetElement>(null);
  const fits = useNamesFit(group, labels === "auto");
  const hidden = labels === "hidden" || (labels === "auto" && !fits);
  const count = Children.toArray(children).filter(isValidElement).length;
  // Balanced rows: as few as hold six each, with the providers shared out evenly (7 → 4 + 3).
  const columns = count > ROW ? Math.ceil(count / Math.ceil(count / ROW)) : undefined;
  return (
    <ProviderButtonLabelsHidden value={hidden}>
      <fieldset
        {...props}
        ref={mergeRefs(ref, group)}
        className={cx("qx-provider-button-group", className)}
        data-slot="provider-button-group"
        data-labels={hidden ? "hidden" : undefined}
        data-columns={columns}
      >
        {children}
      </fieldset>
    </ProviderButtonLabelsHidden>
  );
}

/**
 * Whether every provider's name fits its cell beside its logo. Measured the same way in either
 * form, so the answer doesn't flip-flop as the form changes: a cell's width doesn't depend on its
 * content, the name keeps its natural width while it's hidden, and the room is the full form's,
 * from the tokens, not the logo-only form's own padding.
 */
function useNamesFit(group: RefObject<HTMLFieldSetElement | null>, measures: boolean): boolean {
  const [fits, setFits] = useState(true);
  useLayoutEffect(() => {
    const element = group.current;
    if (!measures || !element || typeof ResizeObserver === "undefined") return;
    const measure = () => setFits(namesFit(element));
    // A resize observer reports once as it starts, before the next paint, then on every resize.
    const resizes = new ResizeObserver(measure);
    resizes.observe(element);
    // A provider added, removed or renamed changes the names without resizing the row.
    const edits = new MutationObserver(measure);
    edits.observe(element, { childList: true, subtree: true, characterData: true });
    const fonts = typeof document === "undefined" ? undefined : document.fonts;
    fonts?.addEventListener("loadingdone", measure);
    return () => {
      resizes.disconnect();
      edits.disconnect();
      fonts?.removeEventListener("loadingdone", measure);
    };
  }, [group, measures]);
  return fits;
}

function namesFit(group: HTMLElement): boolean {
  for (const button of group.querySelectorAll<HTMLElement>(
    ":scope > [data-slot=provider-button]",
  )) {
    const name = button.querySelector<HTMLElement>("[data-slot=provider-button-label]");
    if (!name) continue;
    const style = getComputedStyle(button);
    // The room the full form gives a name: the cell less its padding (space.inset.md each side),
    // and the 20px logo and its gap where there's a logo.
    const padding = pixels(style.getPropertyValue("--qx-space-inset-md")) * 2;
    const logo = button.querySelector("[data-slot=provider-button-logo]")
      ? pixels(style.getPropertyValue("--qx-size-icon-md")) + Number.parseFloat(style.columnGap)
      : 0;
    const room = button.clientWidth - padding - logo;
    // scrollWidth is the name's natural width in either form, rounded up to a whole pixel.
    if (name.scrollWidth > Math.ceil(room)) return false;
  }
  return true;
}

/** A token's length in pixels: px as it is, rem against the root's font size. */
function pixels(value: string): number {
  const number = Number.parseFloat(value);
  if (!value.trim().endsWith("rem")) return number;
  return number * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
}
