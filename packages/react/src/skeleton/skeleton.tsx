import type { ComponentProps, ReactElement } from "react";
import { cx } from "../internal/cx";

export type SkeletonVariant = "text" | "block" | "circle";

/** A circle's diameter, as Avatar's sizes: `sm` 24 · `md` 32 · `lg` 40 · `xl` 48px. */
export type SkeletonSize = "sm" | "md" | "lg" | "xl";

export interface SkeletonProps extends ComponentProps<"span"> {
  /** `text` (one line), `block` (a card or image) or `circle` (an avatar). Default `text`. */
  variant?: SkeletonVariant;
  /**
   * With `variant="text"`: a paragraph of this many lines, the last one shorter. It takes the
   * lines' height, so the text that replaces it doesn't move what's below.
   */
  lines?: number;
  /** With `variant="circle"`: the diameter, matching Avatar's `size`. Default `md` (32px). */
  size?: SkeletonSize;
}

/**
 * A placeholder shaped like the content that is loading. Size it with `style` or `className`, or
 * use `lines` for a paragraph and `size` for an avatar. It is hidden from assistive technology: set
 * `aria-busy` on the loading region and announce the wait with a Spinner or text. Server-safe.
 */
export function Skeleton({
  variant = "text",
  lines,
  size,
  className,
  ...props
}: SkeletonProps): ReactElement {
  if (variant === "text" && lines !== undefined) {
    return (
      <span
        {...props}
        aria-hidden
        className={cx("qx-skeleton-lines", className)}
        data-slot="skeleton-lines"
      >
        {Array.from({ length: Math.max(1, Math.floor(lines)) }, (_, line) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: placeholder lines are positions
          <span key={line} className="qx-skeleton" data-slot="skeleton" data-variant="text" />
        ))}
      </span>
    );
  }
  return (
    <span
      {...props}
      aria-hidden
      className={cx("qx-skeleton", className)}
      data-slot="skeleton"
      data-variant={variant}
      data-size={variant === "circle" ? (size ?? "md") : undefined}
    />
  );
}
