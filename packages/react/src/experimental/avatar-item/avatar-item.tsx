import type { ComponentProps, ReactElement, ReactNode } from "react";
import { Avatar, type AvatarShape, type AvatarSize } from "../../avatar/avatar";
import { cx } from "../../internal/cx";

export interface AvatarItemProps extends Omit<ComponentProps<"div">, "children"> {
  /** The person's name: the first line, and the avatar's initials. */
  name: string;
  /** A second line: their email, role or team. */
  description?: ReactNode;
  /** Their photo; the initials show while it loads, and if it fails. */
  src?: string;
  /** The avatar's size: `md` (32px) is the height of the two lines. Default `md`. */
  size?: AvatarSize;
  /**
   * The avatar's shape: `circle` for a person, `square` for an organisation, an application or a
   * tenant. Default `circle`.
   */
  shape?: AvatarShape;
}

/**
 * A person, as lists and menus show them: their avatar, their name and an optional second line,
 * such as an email; an organisation or application takes `shape="square"`. The two lines sit
 * close, the name on the second line's line height, so together they're as tall as a `md` avatar
 * and fit a compact table row. Long text ends with an ellipsis where the space runs out. The avatar
 * is hidden from assistive technology, since the name is shown. Like Atlassian's AvatarItem and
 * Fluent's Persona. Server-safe.
 */
export function AvatarItem({
  name,
  description,
  src,
  size = "md",
  shape = "circle",
  className,
  ...props
}: AvatarItemProps): ReactElement {
  return (
    <div {...props} className={cx("qx-avatar-item", className)} data-slot="avatar-item">
      <Avatar
        name={name}
        size={size}
        shape={shape}
        decorative
        {...(src === undefined ? {} : { src })}
      />
      <span className="qx-avatar-item-text" data-slot="avatar-item-text">
        <span className="qx-avatar-item-name" data-slot="avatar-item-name">
          {name}
        </span>
        {description != null && (
          <span className="qx-avatar-item-description" data-slot="avatar-item-description">
            {description}
          </span>
        )}
      </span>
    </div>
  );
}
