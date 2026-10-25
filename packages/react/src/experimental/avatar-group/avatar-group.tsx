"use client";

import type { ComponentProps, ReactElement } from "react";
import { Avatar, type AvatarShape, type AvatarSize } from "../../avatar/avatar";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { fill } from "../../internal/template";
import { useLocale, useMessages } from "../../provider/provider";

/** One person, organisation or application in the group. */
export interface AvatarGroupPerson {
  /** Their name: part of the group's name, and the source of the initials. */
  name: string;
  /** Their photo or logo. */
  src?: string;
}

export interface AvatarGroupProps extends Omit<ComponentProps<"span">, "children"> {
  /** The people, or the first few of them when `total` is larger. Names may repeat. */
  people: readonly AvatarGroupPerson[];
  /** How many avatars to show before +N. Default `3`. */
  max?: number;
  /** How many people there are in all, when `people` is only the first few: a group's 412 members. */
  total?: number;
  /** The avatars' size: `sm` (24px) fits a table row. Default `sm`. */
  size?: AvatarSize;
  /**
   * `circle` for people; `square` for organisations, applications or tenants, with a square +N.
   * Say what they are in `messages.label`, e.g. "{count} applications: {names}". Default `circle`.
   */
  shape?: AvatarShape;
  /** Default: QeetrixProvider's locale. It formats the counts and the list of names. */
  locale?: string;
  /** This group's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["avatarGroup"]>;
}

/**
 * A few people at a glance: a group's members, an application's users. The first `max` avatars
 * side by side, a hairline apart so initials stay whole on any background, then +N for the rest.
 * It's one image to assistive technology, named in full: "412 people: Priya Sharma, Rahul Verma,
 * Ananya Iyer and 409 more". Organisations and applications take `shape="square"`. Part of the
 * Avatar family.
 */
export function AvatarGroup({
  people,
  max = 3,
  total,
  size = "sm",
  shape = "circle",
  locale: localeProp,
  messages,
  className,
  ...props
}: AvatarGroupProps): ReactElement {
  const strings = useMessages("avatarGroup", messages);
  const provided = useLocale();
  const locale = localeProp ?? provided;
  const count = Math.max(total ?? people.length, people.length);
  // Show `max`, unless one more would be the last: "+1" says less than the face.
  const shown = people.slice(0, count - max === 1 ? max + 1 : max);
  const rest = count - shown.length;
  const number = new Intl.NumberFormat(locale);
  const names = shown.map((person) => person.name);
  // Names can repeat (two Priya Sharmas): each key is the name and how many times it came before,
  // so keys stay unique, and an avatar whose person changes remounts with no image state left over.
  const seen = new Map<string, number>();
  const avatars = shown.map((person) => {
    const before = seen.get(person.name) ?? 0;
    seen.set(person.name, before + 1);
    return { person, key: `${person.name}\u0000${before}` };
  });
  const list = new Intl.ListFormat(locale, { type: "conjunction" }).format(
    rest > 0 ? [...names, fill(strings.more, { count: number.format(rest) })] : names,
  );
  return (
    <span
      role="img"
      aria-label={fill(strings.label, { count: number.format(count), names: list })}
      {...props}
      className={cx("qx-avatar-group", className)}
      data-slot="avatar-group"
      data-size={size}
      data-shape={shape}
    >
      {avatars.map(({ person, key }) => (
        <Avatar
          key={key}
          name={person.name}
          size={size}
          shape={shape}
          decorative
          {...(person.src ? { src: person.src } : {})}
        />
      ))}
      {rest > 0 && (
        <span className="qx-avatar-group-more" data-slot="avatar-group-more" aria-hidden>
          +{number.format(rest)}
        </span>
      )}
    </span>
  );
}
