"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import { XIcon } from "@qeetrix/icons/icons/x";
import {
  type ComponentProps,
  type Context,
  type CSSProperties,
  createContext,
  type ReactElement,
  type ReactNode,
  use,
  useRef,
} from "react";
import { IconButton } from "../button/button";
import { cx } from "../internal/cx";
import { messages } from "../internal/messages";
import { mergeRefs } from "../internal/refs";

/** The edge a drawer opens from, in the text direction: `end` is the right edge in English. */
export type DrawerSide = "start" | "end";
export type DrawerSize = "sm" | "md" | "lg";

const SideContext: Context<DrawerSide> = createContext<DrawerSide>("end");

const FOCUSABLE =
  'input:not([type="hidden"], :disabled), textarea:not(:disabled), select:not(:disabled), button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])';

export interface DrawerProps extends Omit<BaseDrawer.Root.Props, "swipeDirection"> {
  /** Default `end`. Right-to-left layouts need Base UI's DirectionProvider, as its keyboard does. */
  side?: DrawerSide;
}

export type DrawerTriggerProps = BaseDrawer.Trigger.Props;
export type DrawerCloseProps = BaseDrawer.Close.Props;

export interface DrawerContentProps
  extends Omit<BaseDrawer.Popup.Props, "className" | "style" | "title" | "children"> {
  /** The title; it labels the drawer. */
  title: ReactNode;
  /** A line under the title; it describes the drawer. */
  description?: ReactNode;
  /** Width: `sm` 400, `md` 560 (default) or `lg` 800px. */
  size?: DrawerSize;
  /** Placement only. */
  className?: string;
  style?: CSSProperties;
  /** DrawerBody and DrawerFooter. */
  children?: ReactNode;
}

export interface DrawerBodyProps extends Omit<BaseDrawer.Content.Props, "className"> {
  className?: string;
}
export interface DrawerFooterProps extends ComponentProps<"div"> {}

/** Holds a drawer's open state: `open` / `defaultOpen` / `onOpenChange(open, details)`. */
export function Drawer({ side = "end", ...props }: DrawerProps): ReactElement {
  const rtl = useDirection() === "rtl";
  // Swiping toward the edge it came from closes it; that edge is physical.
  const swipeDirection = (side === "end") === rtl ? "left" : "right";
  return (
    <SideContext value={side}>
      <BaseDrawer.Root {...props} swipeDirection={swipeDirection} />
    </SideContext>
  );
}

/** Opens the drawer. Render your own control: `render={<Button>Edit</Button>}`. */
export function DrawerTrigger(props: DrawerTriggerProps): ReactElement {
  return <BaseDrawer.Trigger {...props} />;
}

/** Closes the drawer, e.g. Cancel: `render={<Button variant="ghost">Cancel</Button>}`. */
export function DrawerClose(props: DrawerCloseProps): ReactElement {
  return <BaseDrawer.Close {...props} />;
}

/**
 * A full-height side panel (06-component-specs.md, increment 4) with a ruled header, a scrolling
 * body and a ruled footer. Escape, an outside click and a swipe toward its edge close it. On open,
 * focus goes to the first focusable element in the body, as in a dialog; on touch it goes to the
 * drawer itself, so a phone's keyboard doesn't open over it.
 */
export function DrawerContent({
  title,
  description,
  size = "md",
  initialFocus,
  ref,
  className,
  children,
  ...props
}: DrawerContentProps): ReactElement {
  const side = use(SideContext);
  const popup = useRef<HTMLDivElement>(null);
  const firstInBody: DrawerContentProps["initialFocus"] = (type) =>
    type === "touch" ||
    (popup.current?.querySelector<HTMLElement>(`[data-slot="drawer-body"] :is(${FOCUSABLE})`) ??
      true);
  return (
    <BaseDrawer.Portal>
      <BaseDrawer.Backdrop className="qx-drawer-backdrop" data-slot="drawer-backdrop" />
      <BaseDrawer.Viewport className="qx-drawer-viewport" data-side={side}>
        <BaseDrawer.Popup
          {...props}
          ref={mergeRefs(ref, popup)}
          initialFocus={initialFocus ?? firstInBody}
          className={cx("qx-drawer", className)}
          data-slot="drawer-popup"
          data-size={size}
        >
          <div className="qx-drawer-header" data-slot="drawer-header">
            <BaseDrawer.Title className="qx-drawer-title" data-slot="drawer-title">
              {title}
            </BaseDrawer.Title>
            {description != null && (
              <BaseDrawer.Description
                className="qx-drawer-description"
                data-slot="drawer-description"
              >
                {description}
              </BaseDrawer.Description>
            )}
          </div>
          {children}
          <div className="qx-drawer-close" data-slot="drawer-close">
            <BaseDrawer.Close
              render={<IconButton icon={XIcon} aria-label={messages.overlay.close} size="sm" />}
            />
          </div>
        </BaseDrawer.Popup>
      </BaseDrawer.Viewport>
    </BaseDrawer.Portal>
  );
}

/** The drawer's content; it scrolls, and text in it can be selected without starting a swipe. */
export function DrawerBody({ className, ...props }: DrawerBodyProps): ReactElement {
  return (
    <BaseDrawer.Content
      {...props}
      className={cx("qx-drawer-body", className)}
      data-slot="drawer-body"
    />
  );
}

/** The actions, end-aligned under a rule: tertiary first, then the primary action. */
export function DrawerFooter({ className, ...props }: DrawerFooterProps): ReactElement {
  return <div {...props} className={cx("qx-drawer-footer", className)} data-slot="drawer-footer" />;
}
