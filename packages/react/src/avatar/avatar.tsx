"use client";

import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import type { CSSProperties, ReactElement } from "react";
import { cx } from "../internal/cx";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

/** `circle` for a person; `square` for an organisation, an application or a tenant. */
export type AvatarShape = "circle" | "square";

export interface AvatarProps
  extends Omit<BaseAvatar.Root.Props, "className" | "style" | "children"> {
  /**
   * The name of the person, organisation or application: the image's text alternative, and the
   * source of the initials.
   */
  name: string;
  /** The photo or logo. The initials show while it loads, and if it fails. */
  src?: string;
  /** `sm` 24, `md` 32, `lg` 40 or `xl` 48px. Default `md`. */
  size?: AvatarSize;
  /**
   * `circle` for a person. `square`, with the 4px corners of controls, for an organisation, an
   * application or a tenant, so they never read as people. Default `circle`.
   */
  shape?: AvatarShape;
  /** The name is shown beside it: hide the avatar from assistive technology. */
  decorative?: boolean;
  /** Classes for layout, such as margins. */
  className?: string;
  /** Inline styles for layout. */
  style?: CSSProperties;
}

const graphemes =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : undefined;

function firstGrapheme(word: string): string {
  if (!graphemes) return Array.from(word)[0] ?? "";
  for (const { segment } of graphemes.segment(word)) return segment;
  return "";
}

/** The first grapheme of the first and last words: "Priya Sharma" is "PS". */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0] ?? "";
  const last = words.length > 1 ? (words.at(-1) ?? "") : "";
  return (firstGrapheme(first) + firstGrapheme(last)).toLocaleUpperCase();
}

/**
 * A person, or an organisation, application or tenant: their photo or logo, or their initials. A
 * person is a circle, since people are one of the two soft shapes; anything else is a square. It's
 * named by `name`, unless `decorative`.
 */
export function Avatar({
  name,
  src,
  size = "md",
  shape = "circle",
  decorative,
  className,
  ...props
}: AvatarProps): ReactElement {
  return (
    <BaseAvatar.Root
      {...props}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
      className={cx("qx-avatar", className)}
      data-slot="avatar"
      data-size={size}
      data-shape={shape}
    >
      {src && (
        <BaseAvatar.Image src={src} alt="" className="qx-avatar-image" data-slot="avatar-image" />
      )}
      <BaseAvatar.Fallback className="qx-avatar-fallback" data-slot="avatar-fallback" aria-hidden>
        {initials(name)}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}
