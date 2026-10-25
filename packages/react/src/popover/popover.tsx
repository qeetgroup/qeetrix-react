"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { cx } from "../internal/cx";

export type PopoverProps = BasePopover.Root.Props;
export type PopoverTriggerProps = BasePopover.Trigger.Props;
export type PopoverCloseProps = BasePopover.Close.Props;

export interface PopoverContentProps
  extends Omit<BasePopover.Popup.Props, "className" | "style" | "title" | "children"> {
  /** A heading; when set, the popover is labelled by it. */
  title?: ReactNode;
  /** A line under the title. */
  description?: ReactNode;
  /** The trigger's side to open on. Default `bottom`; it flips when there is no room. */
  side?: BasePopover.Positioner.Props["side"];
  /** Alignment along that side. Default `center`. */
  align?: BasePopover.Positioner.Props["align"];
  /** Distance from the trigger, in pixels. Default 6. */
  sideOffset?: number;
  /** Position against this element instead of the trigger, e.g. the whole field a button sits in. */
  anchor?: BasePopover.Positioner.Props["anchor"];
  /** Placement and sizing only. */
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/** Holds a popover's open state: `open` / `defaultOpen` / `onOpenChange(open, details)`. */
export function Popover(props: PopoverProps): ReactElement {
  return <BasePopover.Root {...props} />;
}

/** Opens the popover. Render your own control: `render={<Button variant="soft">Filter</Button>}`. */
export function PopoverTrigger(props: PopoverTriggerProps): ReactElement {
  return <BasePopover.Trigger {...props} />;
}

/** Closes the popover, e.g. a footer action: `render={<Button>Apply</Button>}`. */
export function PopoverClose(props: PopoverCloseProps): ReactElement {
  return <BasePopover.Close {...props} />;
}

/**
 * Non-modal content anchored to its trigger (06-component-specs.md, increment 4). Focus moves in on
 * open and back to the trigger on close; Escape and an outside click close it.
 */
export function PopoverContent({
  title,
  description,
  side,
  align,
  sideOffset = 6,
  anchor,
  className,
  children,
  ...props
}: PopoverContentProps): ReactElement {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        anchor={anchor}
        className="qx-popover-positioner"
      >
        <BasePopover.Popup
          {...props}
          className={cx("qx-popover", className)}
          data-slot="popover-popup"
        >
          {(title != null || description != null) && (
            <div className="qx-popover-header" data-slot="popover-header">
              {title != null && (
                <BasePopover.Title className="qx-popover-title" data-slot="popover-title">
                  {title}
                </BasePopover.Title>
              )}
              {description != null && (
                <BasePopover.Description
                  className="qx-popover-description"
                  data-slot="popover-description"
                >
                  {description}
                </BasePopover.Description>
              )}
            </div>
          )}
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}
