import type { ComponentProps, ReactElement, ReactNode } from "react";
import { Avatar, type AvatarSize } from "../../avatar/avatar";
import { cx } from "../../internal/cx";

export interface AvatarItemProps extends Omit<ComponentProps<"div">, "children"> {
  /** The person's name: the first line, and the avatar's initials. */
  name: string;
  /** A second line: their email, role or team. */
  description?: ReactNode;
  /** Their photo; the initials show while it loads, and if it fails. */
  src?: string;
  /** The avatar's size. Default `md` (32px), the height of the two lines. */
  size?: AvatarSize;
}

/**
 * A person, as lists and menus show them (07-components.md): their avatar, their name and an
 * optional second line, such as an email. The two lines sit close, the name on the second line's
 * line height, so together they're as tall as a `md` avatar and fit a compact table row. Long text
 * ends with an ellipsis where the space runs out. The avatar is hidden from assistive technology,
 * since the name is shown. Like Atlassian's AvatarItem and Fluent's Persona. Server-safe.
 */
export function AvatarItem({
  name,
  description,
  src,
  size = "md",
  className,
  ...props
}: AvatarItemProps): ReactElement {
  return (
    <div {...props} className={cx("qx-avatar-item", className)} data-slot="avatar-item">
      <Avatar name={name} size={size} decorative {...(src === undefined ? {} : { src })} />
      <span className="qx-avatar-item-text">
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
