"use client";

import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import type { CSSProperties, ReactElement } from "react";
import { cx } from "../internal/cx";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

/** `circle` for a person; `square` for an organisation, an application or a tenant. */
export type AvatarShape = "circle" | "square";

/** A status dot's colour: Badge's tones. */
export type AvatarStatusTone = "neutral" | "brand" | "info" | "success" | "warning" | "danger";

/** A status on the avatar, such as a person's presence: what it is in words, and its colour. */
export interface AvatarStatus {
  /** The status in words: "Online", "Away", "In a meeting". It's read with the name. */
  label: string;
  /** The dot's colour, e.g. `success` for online, `warning` for away. Default `neutral`. */
  tone?: AvatarStatusTone;
}

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
  /**
   * A status dot on the bottom-end corner, such as a person's presence: a `label` ("Online") and a
   * `tone` (`success`). The avatar is named "Priya Sharma, Online". The dot is colour, so where the
   * status matters say it in words too; a `decorative` avatar hides it with the rest of the avatar.
   */
  status?: AvatarStatus;
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

/** The first `count` graphemes of a word. */
function firstGraphemes(word: string, count = 1): string {
  if (!graphemes) return Array.from(word).slice(0, count).join("");
  let out = "";
  let taken = 0;
  for (const { segment } of graphemes.segment(word)) {
    if (taken++ === count) break;
    out += segment;
  }
  return out;
}

/**
 * Legal forms that end a company's name, with or without dots: "Acme Pvt. Ltd." is Acme. Indian
 * forms first (Private Limited, LLP, OPC), then the common international ones.
 */
const LEGAL_FORMS = new Set([
  "pvt",
  "private",
  "ltd",
  "limited",
  "llp",
  "opc",
  "inc",
  "incorporated",
  "llc",
  "plc",
  "corp",
  "co",
  "gmbh",
  "pte",
  "pty",
]);
const isLegalForm = (word: string) => LEGAL_FORMS.has(word.replace(/[.,]/g, "").toLowerCase());

/**
 * The first grapheme of the first and last words: "Priya Sharma" is "PS". A company's legal form
 * doesn't count, so "Kaveri Foods Private Limited" is "KF"; a name left with one word takes its
 * first two, so "Acme Pvt Ltd" is "AC".
 */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  let kept = words.length;
  while (kept > 1 && isLegalForm(words[kept - 1] ?? "")) kept--;
  const first = words[0] ?? "";
  if (kept === 1 && kept < words.length) return firstGraphemes(first, 2).toLocaleUpperCase();
  const last = kept > 1 ? (words[kept - 1] ?? "") : "";
  return (firstGraphemes(first) + firstGraphemes(last)).toLocaleUpperCase();
}

/**
 * A person, or an organisation, application or tenant: their photo or logo, or their initials. A
 * person is a circle, since people are one of the two soft shapes; anything else is a square. It's
 * named by `name`, with its `status` if it has one, unless `decorative`.
 */
export function Avatar({
  name,
  src,
  size = "md",
  shape = "circle",
  status,
  decorative,
  className,
  ...props
}: AvatarProps): ReactElement {
  return (
    <BaseAvatar.Root
      {...props}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : status ? `${name}, ${status.label}` : name}
      aria-hidden={decorative || undefined}
      className={cx("qx-avatar", className)}
      data-slot="avatar"
      data-size={size}
      data-shape={shape}
      data-status={status ? "" : undefined}
    >
      {src && (
        <BaseAvatar.Image src={src} alt="" className="qx-avatar-image" data-slot="avatar-image" />
      )}
      <BaseAvatar.Fallback className="qx-avatar-fallback" data-slot="avatar-fallback" aria-hidden>
        {initials(name)}
      </BaseAvatar.Fallback>
      {status && (
        <span
          className="qx-avatar-status"
          data-slot="avatar-status"
          data-tone={status.tone ?? "neutral"}
          aria-hidden
        />
      )}
    </BaseAvatar.Root>
  );
}
