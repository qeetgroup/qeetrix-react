"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ReactElement, ReactNode } from "react";

export interface TooltipProps extends Omit<BaseTooltip.Root.Props, "children"> {
  /** The text. Short, never interactive and never essential. */
  content: ReactNode;
  /** The trigger: one element that takes a ref and props, such as an IconButton. */
  children: ReactElement;
  /** Default `top`; it flips when there is no room. */
  side?: BaseTooltip.Positioner.Props["side"];
  align?: BaseTooltip.Positioner.Props["align"];
  /** Hover time before it opens, in milliseconds. Default 500; keyboard focus opens it at once. */
  delay?: number;
  /** Time before it closes after the pointer leaves, in milliseconds. */
  closeDelay?: number;
}

export interface TooltipProviderProps extends BaseTooltip.Provider.Props {}

/**
 * Groups tooltips (an app, a toolbar): once one is open, moving to a neighbour opens it at once.
 */
export function TooltipProvider({
  delay = 500,
  closeDelay = 0,
  ...props
}: TooltipProviderProps): ReactElement {
  return <BaseTooltip.Provider {...props} delay={delay} closeDelay={closeDelay} />;
}

/**
 * A short label for a control, most often an icon-only button (06-component-specs.md §7):
 * `<Tooltip content="Download invoice"><IconButton … /></Tooltip>`. It doesn't appear on touch.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  align,
  delay = 500,
  closeDelay,
  ...props
}: TooltipProps): ReactElement {
  return (
    <BaseTooltip.Root {...props}>
      <BaseTooltip.Trigger render={children} delay={delay} closeDelay={closeDelay} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner
          side={side}
          align={align}
          sideOffset={6}
          className="qx-tooltip-positioner"
        >
          <BaseTooltip.Popup className="qx-tooltip" data-slot="tooltip-popup">
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
