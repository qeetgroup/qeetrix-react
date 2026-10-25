"use client";

import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { cx } from "../internal/cx";

export type ScrollAreaOrientation = "vertical" | "horizontal" | "both";

export interface ScrollAreaProps
  extends Omit<BaseScrollArea.Root.Props, "className" | "style" | "children"> {
  /** Which way it scrolls. Default `vertical`. */
  orientation?: ScrollAreaOrientation;
  /**
   * Names the scrolling region, e.g. "Recent invoices". It goes on the viewport, the part that
   * takes keyboard focus when the content overflows, which becomes a `region` landmark. Name every
   * ScrollArea whose content can overflow, so a keyboard user knows what they're scrolling.
   */
  "aria-label"?: string;
  /** The id of a visible heading that names the scrolling region, instead of `aria-label`. */
  "aria-labelledby"?: string;
  /** Its size, e.g. a height (`style={{ blockSize: 320 }}`), and its placement. */
  className?: string;
  /** Its size and placement, e.g. `{ blockSize: 320 }`. */
  style?: CSSProperties;
  /** The content that scrolls. */
  children?: ReactNode;
}

/**
 * A scrolling region with Qeetrix scrollbars that show on hover, while scrolling and on keyboard
 * focus. When its content overflows, the region takes keyboard focus, so it can be scrolled
 * without a pointer; named, it's a `region` landmark.
 */
export function ScrollArea({
  orientation = "vertical",
  "aria-label": label,
  "aria-labelledby": labelledBy,
  className,
  children,
  ...props
}: ScrollAreaProps): ReactElement {
  const named = label !== undefined || labelledBy !== undefined;
  return (
    <BaseScrollArea.Root
      {...props}
      className={cx("qx-scroll-area", className)}
      data-slot="scroll-area"
    >
      <BaseScrollArea.Viewport
        className="qx-scroll-area-viewport"
        data-slot="scroll-area-viewport"
        role={named ? "region" : undefined}
        aria-label={label}
        aria-labelledby={labelledBy}
      >
        <BaseScrollArea.Content className="qx-scroll-area-content" data-slot="scroll-area-content">
          {children}
        </BaseScrollArea.Content>
      </BaseScrollArea.Viewport>
      {orientation !== "horizontal" && (
        <BaseScrollArea.Scrollbar
          orientation="vertical"
          className="qx-scroll-area-scrollbar"
          data-slot="scroll-area-scrollbar"
        >
          <BaseScrollArea.Thumb className="qx-scroll-area-thumb" data-slot="scroll-area-thumb" />
        </BaseScrollArea.Scrollbar>
      )}
      {orientation !== "vertical" && (
        <BaseScrollArea.Scrollbar
          orientation="horizontal"
          className="qx-scroll-area-scrollbar"
          data-slot="scroll-area-scrollbar"
        >
          <BaseScrollArea.Thumb className="qx-scroll-area-thumb" data-slot="scroll-area-thumb" />
        </BaseScrollArea.Scrollbar>
      )}
      {orientation === "both" && <BaseScrollArea.Corner data-slot="scroll-area-corner" />}
    </BaseScrollArea.Root>
  );
}
