"use client";

import {
  type ComponentProps,
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
   * The providers' names. Default `"visible"`: each beside its logo.
   *
   * - `"hidden"`: the logo-only form, for a narrow row such as three providers on a phone. Each logo
   *   is drawn alone at 24px (`size.icon.lg`), centred in its cell, which keeps the field height.
   *   The name is hidden from sight only: each button is still named by its `aria-label`, and the
   *   name shows in a tooltip on hover and keyboard focus, not on touch.
   * - `"auto"`: the logo-only form only while a cell is too narrow for its provider's name. The whole
   *   row changes together. It measures in the browser, so a server-rendered page shows the names
   *   until it hydrates.
   */
  labels?: ProviderButtonLabels | undefined;
  /**
   * ProviderButtons, one per provider, each in an equal cell. Put even a single provider in a
   * group: the group draws the surface, the border and the rules.
   */
  children?: ReactNode;
}

/**
 * The ruled row of sign-in providers ("Continue with Google, Microsoft, Apple"): a `<fieldset>`
 * named by its `aria-label`, on the raised surface, with a 1px border, 4px corners and 1px rules
 * between equal cells. The whole row is the field height (`size.control.lg`), so it lines up with a
 * form's fields and its main button. `labels` gives a narrow row the logo-only form.
 */
export function ProviderButtonGroup({
  labels = "visible",
  className,
  ref,
  ...props
}: ProviderButtonGroupProps): ReactElement {
  const group = useRef<HTMLFieldSetElement>(null);
  const fits = useNamesFit(group, labels === "auto");
  const hidden = labels === "hidden" || (labels === "auto" && !fits);
  return (
    <ProviderButtonLabelsHidden value={hidden}>
      <fieldset
        {...props}
        ref={mergeRefs(ref, group)}
        className={cx("qx-provider-button-group", className)}
        data-slot="provider-button-group"
        data-labels={hidden ? "hidden" : undefined}
      />
    </ProviderButtonLabelsHidden>
  );
}

/**
 * Whether every provider's name fits its cell beside its logo. Measured the same way in either
 * form: a cell's width doesn't depend on its content, and the name keeps its natural width while
 * it's hidden, so the answer doesn't flip-flop as the form changes.
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
    // The room the visible form gives a name: the cell less its padding, and the 20px logo and
    // its gap where there's a logo.
    const padding = Number.parseFloat(style.paddingInlineStart) * 2;
    const logo = button.querySelector("[data-slot=provider-button-logo]")
      ? Number.parseFloat(style.getPropertyValue("--qx-size-icon-md")) +
        Number.parseFloat(style.columnGap)
      : 0;
    const room = button.clientWidth - padding - logo;
    // scrollWidth is the name's natural width in either form, rounded up to a whole pixel.
    if (name.scrollWidth > Math.ceil(room)) return false;
  }
  return true;
}
