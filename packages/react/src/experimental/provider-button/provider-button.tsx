"use client";

import type { ComponentProps, MouseEvent, ReactElement, ReactNode } from "react";
import { cx } from "../../internal/cx";
import { type RenderProp, renderElement } from "../../internal/render";

/** The colour scheme a monochrome logo is inverted in. */
export type ProviderLogoInvert = "light" | "dark";

export interface ProviderButtonProps
  extends Omit<ComponentProps<"button">, "children" | "aria-label" | "disabled"> {
  /**
   * The provider's logo: its own artwork as an `<svg>` or `<img>`, e.g. from `@thesvg/react`.
   * Qeetrix ships no third-party logos. It's decorative (hidden from assistive technology) and
   * drawn at 20px (`size.icon.md`).
   */
  logo?: ReactNode;
  /**
   * Invert a monochrome logo in one colour scheme, where it would vanish: `"light"` for a logo
   * drawn in white (Apple's), `"dark"` for one drawn in black (GitHub's). It follows the nearest
   * `data-qx-color-scheme`, so a section shown in the other scheme gets it right too. A
   * `data-invert="light" | "dark"` attribute on an element inside `logo` does the same for that
   * part alone.
   */
  logoInvert?: ProviderLogoInvert;
  /** The visible label: the provider's name, "Google". */
  children: ReactNode;
  /**
   * Required: the whole action, "Sign in with Google". The visible label is only the provider's
   * name, so this names the button; keep that name in it (WCAG 2.5.3).
   */
  "aria-label": string;
  /**
   * Disabled: it ignores clicks and sets `aria-disabled`, but stays focusable so its reason can be
   * read, as Button does. Default `false`.
   */
  disabled?: boolean;
  /**
   * A link instead of a button, e.g. `render={<a href="/oauth/google" />}` or a router link. Pass
   * `onClick` to ProviderButton, not to this element, so `disabled` can stop it.
   */
  render?: RenderProp;
}

/**
 * One sign-in provider in a ProviderButtonGroup: its logo, then its name, filling an equal cell of
 * the group's ruled row. Named by its `aria-label`, the whole phrase ("Sign in with Google").
 */
export function ProviderButton({
  logo,
  logoInvert,
  disabled = false,
  render,
  type,
  onClick,
  className,
  children,
  ...props
}: ProviderButtonProps): ReactElement {
  return renderElement("button", render, {
    ...props,
    // `type` belongs to a button; a link rendered through `render` gets none.
    type: render === undefined ? (type ?? "button") : type,
    "aria-disabled": disabled || undefined,
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      if (disabled) {
        // A link must not navigate, and a submit button must not submit.
        event.preventDefault();
        return;
      }
      onClick?.(event);
    },
    className: cx("qx-provider-button", className),
    "data-slot": "provider-button",
    "data-disabled": disabled ? "" : undefined,
    children: (
      <>
        {logo != null && (
          <span
            className="qx-provider-button-logo"
            data-slot="provider-button-logo"
            data-invert={logoInvert}
            aria-hidden
          >
            {logo}
          </span>
        )}
        <span className="qx-provider-button-label" data-slot="provider-button-label">
          {children}
        </span>
      </>
    ),
  });
}
