import type { IconProps } from "@qeetrix/icons";
import { cloneElement, isValidElement, type ReactElement } from "react";
import type { QeetrixIcon } from "./control";
import { cx } from "./cx";

/**
 * An icon prop: a component from `@qeetrix/icons` (`icon={PlusIcon}`), or an element
 * (`icon={<PlusIcon />}`), which a Server Component can pass where it can't pass a function.
 * Either way Qeetrix draws it at its own size, hidden from assistive technology.
 */
export type IconSource = QeetrixIcon | ReactElement<IconProps<"outline">>;

interface IconDrawing {
  size: number;
  /** Default `sharp`. */
  shape?: "sharp" | "round";
  /** A filled drawing, where the place calls for one (a pressed Toggle, a selected Tab). */
  variant?: "filled";
  className?: string;
  "data-slot"?: string;
}

/**
 * Draws an icon prop the one Qeetrix way: `shape` (sharp by default), at `size`, `aria-hidden`,
 * with the place's class and slot. An element keeps its other props, such as `data-qx-mirror`.
 *
 * An element from a Server Component arrives as the `<svg>` the icon rendered on the server, so
 * its drawing is already chosen: Qeetrix sizes it, hides it and adds the class, and there is no
 * filled drawing to swap to (`null`). Write `<PlusIcon shape="sharp" />` there to match.
 */
export function drawIcon(
  icon: IconSource,
  { size, shape = "sharp", variant, className, ...props }: IconDrawing,
): ReactElement | null {
  if (!isValidElement<IconProps & { className?: string }>(icon)) {
    const Icon = icon as QeetrixIcon;
    return (
      <Icon
        {...(variant ? ({ variant } as object) : {})}
        shape={shape}
        size={size}
        aria-hidden
        className={className}
        {...props}
      />
    );
  }
  const own = icon.props.className;
  if (typeof icon.type === "string") {
    if (variant) return null;
    return cloneElement(icon, {
      width: size,
      height: size,
      "aria-hidden": true,
      className: cx(own, className),
      ...props,
    } as object);
  }
  return cloneElement(icon, {
    ...(variant ? { variant } : {}),
    shape,
    size,
    "aria-hidden": true,
    className: cx(own, className),
    ...props,
  } as object);
}
