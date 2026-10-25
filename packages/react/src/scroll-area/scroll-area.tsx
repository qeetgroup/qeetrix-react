"use client";

import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { cx } from "../internal/cx";

export type ScrollAreaOrientation = "vertical" | "horizontal" | "both";

export interface ScrollAreaProps
  extends Omit<BaseScrollArea.Root.Props, "className" | "style" | "children"> {
  /** Which way it scrolls. Default `vertical`. */
  orientation?: ScrollAreaOrientation;
  /** Its size, e.g. a height (`style={{ blockSize: 320 }}`), and its placement. */
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * A scrolling region with Qeetrix scrollbars that show on hover, while scrolling and on keyboard
 * focus (06-component-specs.md, increment 5). When its content overflows, the region takes keyboard
 * focus, so it can be scrolled without a pointer.
 */
export function ScrollArea({
  orientation = "vertical",
  className,
  children,
  ...props
}: ScrollAreaProps): ReactElement {
  return (
    <BaseScrollArea.Root
      {...props}
      className={cx("qx-scroll-area", className)}
      data-slot="scroll-area"
    >
      <BaseScrollArea.Viewport className="qx-scroll-area-viewport" data-slot="scroll-area-viewport">
        <BaseScrollArea.Content className="qx-scroll-area-content">
          {children}
        </BaseScrollArea.Content>
      </BaseScrollArea.Viewport>
      {orientation !== "horizontal" && (
        <BaseScrollArea.Scrollbar orientation="vertical" className="qx-scroll-area-scrollbar">
          <BaseScrollArea.Thumb className="qx-scroll-area-thumb" />
        </BaseScrollArea.Scrollbar>
      )}
      {orientation !== "vertical" && (
        <BaseScrollArea.Scrollbar orientation="horizontal" className="qx-scroll-area-scrollbar">
          <BaseScrollArea.Thumb className="qx-scroll-area-thumb" />
        </BaseScrollArea.Scrollbar>
      )}
      {orientation === "both" && <BaseScrollArea.Corner />}
    </BaseScrollArea.Root>
  );
}
