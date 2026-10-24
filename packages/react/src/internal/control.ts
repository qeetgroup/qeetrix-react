import type { IconProps } from "@qeetrix/icons";
import type { ComponentType } from "react";

/** The control heights: sm, md and lg follow the density tokens (size.control.*). */
export type ControlSize = "sm" | "md" | "lg";

/**
 * A component from `@qeetrix/icons`: every icon has an outline drawing, so any icon fits. Qeetrix
 * renders it in the sharp shape at the right size.
 */
export type QeetrixIcon = ComponentType<IconProps<"outline">>;

/** Icon size inside a control: 16px, or 20px in a large control. */
export const iconSize = (size: ControlSize): number => (size === "lg" ? 20 : 16);
