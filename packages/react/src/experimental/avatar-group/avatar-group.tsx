"use client";

import type { ComponentProps, ReactElement } from "react";
import { Avatar, type AvatarSize } from "../../avatar/avatar";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { fill } from "../../internal/template";
import { useLocale, useMessages } from "../../provider/provider";

/** One person in the group. */
export interface AvatarGroupPerson {
  name: string;
  src?: string;
}

export interface AvatarGroupProps extends Omit<ComponentProps<"span">, "children"> {
  /** The people, or the first few of them when `total` is larger. */
  people: readonly AvatarGroupPerson[];
  /** How many avatars to show before +N. Default 3. */
  max?: number;
  /** How many people there are in all, when `people` is only the first few: a group's 412 members. */
  total?: number;
  /** Default `sm` (24px), for a table row. */
  size?: AvatarSize;
  /** Default: QeetrixProvider's locale. It formats the counts and the list of names. */
  locale?: string;
  /** This group's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["avatarGroup"]>;
}

/**
 * A few people at a glance (07-components.md): a group's members, an application's users. The
 * first `max` avatars side by side, a hairline apart so initials stay whole on any background, then
 * +N for the rest. It's one image to assistive technology, named in full: "412 people: Priya
 * Sharma, Rahul Verma, Ananya Iyer and 409 more". Part of the Avatar family.
 */
export function AvatarGroup({
  people,
  max = 3,
  total,
  size = "sm",
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
    >
      {shown.map((person) => (
        <Avatar
          key={person.name}
          name={person.name}
          size={size}
          decorative
          {...(person.src ? { src: person.src } : {})}
        />
      ))}
      {rest > 0 && (
        <span className="qx-avatar-group-more" aria-hidden>
          +{number.format(rest)}
        </span>
      )}
    </span>
  );
}
