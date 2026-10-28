import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cx } from "../../internal/cx";

export interface StateRulerProps extends Omit<ComponentProps<"ol">, "children"> {
  /** Required: what the states are of, e.g. "Connection states". */
  "aria-label": string;
  /** The StateRulerItems, in their usual order. */
  children?: ReactNode;
}

export interface StateRulerItemProps extends Omit<ComponentProps<"li">, "children"> {
  /** The state's word: "Draft". */
  label: ReactNode;
  /** What it means for people: "Saved, but no one signs in through it yet." */
  description?: ReactNode;
  /** The state the record is in: `aria-current` and an Ember rule over it. */
  current?: boolean;
}

/**
 * A record's states side by side, what each means, and which it's in, such as a connection's
 * draft, on and off. One row, stacked where it's narrow. Server-safe.
 */
export function StateRuler({ className, children, ...props }: StateRulerProps): ReactElement {
  return (
    <ol {...props} className={cx("qx-state-ruler", className)} data-slot="state-ruler">
      {children}
    </ol>
  );
}

/** One state: its word and what it means; `current` marks the one the record is in. */
export function StateRulerItem({
  label,
  description,
  current,
  className,
  ...props
}: StateRulerItemProps): ReactElement {
  return (
    <li
      {...props}
      className={cx("qx-state-ruler-item", className)}
      data-slot="state-ruler-item"
      aria-current={current ? "true" : undefined}
    >
      <span className="qx-state-ruler-label">{label}</span>
      {description != null && <span className="qx-state-ruler-description">{description}</span>}
    </li>
  );
}
