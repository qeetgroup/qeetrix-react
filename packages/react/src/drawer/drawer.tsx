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
  useMemo,
  useRef,
} from "react";
import { IconButton } from "../button/button";
import { cx } from "../internal/cx";
import type { QeetrixMessages } from "../internal/messages";
import { mergeRefs } from "../internal/refs";
import { useScrollFocus } from "../internal/scroll-focus";
import { useMessages } from "../provider/provider";

/** The edge a drawer opens from, in the text direction: `end` is the right edge in English. */
export type DrawerSide = "start" | "end";
export type DrawerSize = "sm" | "md" | "lg";

interface DrawerState {
  side: DrawerSide;
  dismissible: boolean;
}
const DrawerContext: Context<DrawerState> = createContext<DrawerState>({
  side: "end",
  dismissible: true,
});
/** The ways a user dismisses a drawer, as opposed to choosing one of its actions. */
const DISMISSALS = new Set(["escape-key", "close-watcher", "outside-press", "focus-out", "swipe"]);

const FOCUSABLE =
  'input:not([type="hidden"], :disabled), textarea:not(:disabled), select:not(:disabled), button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])';

export interface DrawerProps extends Omit<BaseDrawer.Root.Props, "swipeDirection"> {
  /**
   * The edge it opens from: `end` is the right edge in left-to-right text. Right-to-left layouts
   * need Base UI's DirectionProvider, as its keyboard does. Default `end`.
   */
  side?: DrawerSide;
  /**
   * Whether Escape, an outside click, a swipe and the close button can dismiss it. Turn it off for
   * a panel only its own actions should close, such as an unsaved form. Default `true`.
   */
  dismissible?: boolean;
}

export type DrawerTriggerProps = BaseDrawer.Trigger.Props;
export type DrawerCloseProps = BaseDrawer.Close.Props;

export interface DrawerContentProps
  extends Omit<BaseDrawer.Popup.Props, "className" | "style" | "title" | "children"> {
  /** The title; it labels the drawer. */
  title: ReactNode;
  /** A line under the title; it describes the drawer. */
  description?: ReactNode;
  /**
   * Width: `sm` 400, `md` 560 or `lg` 800px, never wider than the viewport less 48px. Default `md`.
   */
  size?: DrawerSize;
  /** The close button's label, over QeetrixProvider's and the English default. */
  messages?: Partial<QeetrixMessages["overlay"]>;
  /** Placement only. */
  className?: string;
  /** Inline styles for the panel, for placement only. */
  style?: CSSProperties;
  /** DrawerBody and DrawerFooter. */
  children?: ReactNode;
}

export interface DrawerBodyProps extends Omit<BaseDrawer.Content.Props, "className"> {
  /** Placement only. */
  className?: string;
}
export interface DrawerFooterProps extends ComponentProps<"div"> {}

/** Holds a drawer's open state: `open` / `defaultOpen` / `onOpenChange(open, details)`. */
export function Drawer({
  side = "end",
  dismissible = true,
  disablePointerDismissal,
  onOpenChange,
  ...props
}: DrawerProps): ReactElement {
  const rtl = useDirection() === "rtl";
  // Swiping toward the edge it came from closes it; that edge is physical.
  const swipeDirection = (side === "end") === rtl ? "left" : "right";
  const handleOpenChange: DrawerProps["onOpenChange"] = (open, details) => {
    if (!open && !dismissible && DISMISSALS.has(details.reason)) {
      details.cancel();
      return;
    }
    onOpenChange?.(open, details);
  };
  return (
    <DrawerContext value={{ side, dismissible }}>
      <BaseDrawer.Root
        {...props}
        swipeDirection={swipeDirection}
        disablePointerDismissal={!dismissible || disablePointerDismissal}
        onOpenChange={handleOpenChange}
      />
    </DrawerContext>
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
 * A full-height side panel with a ruled header, a scrolling body and a ruled footer. Escape, an
 * outside click and a swipe toward its edge close it, unless the Drawer isn't `dismissible`. On
 * open, focus goes to the first focusable element in the body, as in a dialog; on touch it goes to
 * the drawer itself, so a phone's keyboard doesn't open over it.
 */
export function DrawerContent({
  title,
  description,
  size = "md",
  messages,
  initialFocus,
  ref,
  className,
  children,
  ...props
}: DrawerContentProps): ReactElement {
  const { side, dismissible } = use(DrawerContext);
  const strings = useMessages("overlay", messages);
  const popup = useRef<HTMLDivElement>(null);
  const popupRef = useMemo(() => mergeRefs(ref, popup), [ref]);
  const firstInBody: DrawerContentProps["initialFocus"] = (type) =>
    type === "touch" ||
    (popup.current?.querySelector<HTMLElement>(`[data-slot="drawer-body"] :is(${FOCUSABLE})`) ??
      true);
  return (
    <BaseDrawer.Portal>
      <BaseDrawer.Backdrop className="qx-drawer-backdrop" data-slot="drawer-backdrop" />
      <BaseDrawer.Viewport
        className="qx-drawer-viewport"
        data-slot="drawer-viewport"
        data-side={side}
      >
        <BaseDrawer.Popup
          {...props}
          ref={popupRef}
          initialFocus={initialFocus ?? firstInBody}
          className={cx("qx-drawer", className)}
          data-slot="drawer-popup"
          data-size={size}
          data-dismissible={dismissible ? "" : undefined}
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
          {dismissible && (
            <div className="qx-drawer-close" data-slot="drawer-close">
              <BaseDrawer.Close
                render={
                  <IconButton icon={XIcon} aria-label={strings.close} size="sm" tone="neutral" />
                }
              />
            </div>
          )}
        </BaseDrawer.Popup>
      </BaseDrawer.Viewport>
    </BaseDrawer.Portal>
  );
}

/**
 * The drawer's content; it scrolls, and text in it can be selected without starting a swipe. When
 * it scrolls and holds nothing focusable, it takes keyboard focus itself, so it can be scrolled
 * without a pointer.
 */
export function DrawerBody({ className, ref, tabIndex, ...props }: DrawerBodyProps): ReactElement {
  const [scrollRef, scrollTabIndex] = useScrollFocus<HTMLDivElement>();
  const bodyRef = useMemo(() => mergeRefs(ref, scrollRef), [ref, scrollRef]);
  return (
    <BaseDrawer.Content
      {...props}
      ref={bodyRef}
      tabIndex={tabIndex ?? scrollTabIndex}
      className={cx("qx-drawer-body", className)}
      data-slot="drawer-body"
    />
  );
}

/** The actions, end-aligned under a rule: tertiary first, then the primary action. */
export function DrawerFooter({ className, ...props }: DrawerFooterProps): ReactElement {
  return <div {...props} className={cx("qx-drawer-footer", className)} data-slot="drawer-footer" />;
}
