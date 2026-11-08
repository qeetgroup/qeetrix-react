import type { ComponentProps, ReactElement, ReactNode } from "react";
import { Avatar, type AvatarShape, type AvatarSize, type AvatarStatus } from "../../avatar/avatar";
import { cx } from "../../internal/cx";
import { VisuallyHidden } from "../../visually-hidden/visually-hidden";

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
  /**
   * A status dot on the avatar, such as presence: a `label` ("Online") and a `tone`, as Avatar takes
   *. The name is read with it, "Priya Sharma, Online", as an Avatar's is.
   */
  status?: AvatarStatus;
}

/**
 * A person, as lists and menus show them: their avatar, their name and an optional second line,
 * such as an email; an organisation or application takes `shape="square"`. The two lines sit
 * close, the name on the second line's line height, so together they're as tall as a `md` avatar
 * and fit a compact table row. Text too long for the space wraps, so it's never cut. The avatar
 * is hidden from assistive technology, since the name is shown. Like Atlassian's AvatarItem and
 * Fluent's Persona. Server-safe.
 */
export function AvatarItem({
  name,
  description,
  src,
  size = "md",
  shape = "circle",
  status,
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
        {...(status === undefined ? {} : { status })}
      />
      <span className="qx-avatar-item-text" data-slot="avatar-item-text">
        <span className="qx-avatar-item-name" data-slot="avatar-item-name">
          {name}
          {/* The dot is on the decorative avatar, so its words go with the name. */}
          {status && <VisuallyHidden>, {status.label}</VisuallyHidden>}
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
