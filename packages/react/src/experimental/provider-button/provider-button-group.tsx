import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cx } from "../../internal/cx";

export interface ProviderButtonGroupProps extends Omit<ComponentProps<"fieldset">, "aria-label"> {
  /**
   * Required: what the buttons are for, e.g. "Sign in with another account". The group shows no
   * legend, so this names it.
   */
  "aria-label": string;
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
 * form's fields and its main button. Server-safe.
 */
export function ProviderButtonGroup({
  className,
  ...props
}: ProviderButtonGroupProps): ReactElement {
  return (
    <fieldset
      {...props}
      className={cx("qx-provider-button-group", className)}
      data-slot="provider-button-group"
    />
  );
}
