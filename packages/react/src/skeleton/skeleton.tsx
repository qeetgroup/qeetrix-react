import type { ComponentProps, ReactElement } from "react";
import { cx } from "../internal/cx";

export type SkeletonVariant = "text" | "block" | "circle";

export interface SkeletonProps extends ComponentProps<"span"> {
  /** `text` (one line), `block` (a card or image) or `circle` (an avatar). Default `text`. */
  variant?: SkeletonVariant;
}

/**
 * A placeholder shaped like the content that is loading (06-component-specs.md, increment 6). Size
 * it with `style` or `className`. It is hidden from assistive technology: set `aria-busy` on the
 * loading region and announce the wait with a Spinner or text. Server-safe.
 */
export function Skeleton({ variant = "text", className, ...props }: SkeletonProps): ReactElement {
  return (
    <span
      {...props}
      aria-hidden
      className={cx("qx-skeleton", className)}
      data-slot="skeleton"
      data-variant={variant}
    />
  );
}
