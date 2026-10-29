"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { useDirection } from "@base-ui/react/direction-provider";
import { GripIcon } from "@qeetrix/icons/icons/grip";
import { MoveDiagonal2Icon } from "@qeetrix/icons/icons/move-diagonal-2";
import { XIcon } from "@qeetrix/icons/icons/x";
import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  useRef,
  useState,
} from "react";
import { IconButton } from "../../button/button";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { readStored, writeStored } from "../../internal/storage";
import { useMessages, usePortalContainer } from "../../provider/provider";

/** Where a panel sits: its inline-start and top edges from the window's, and its size, in pixels. */
export interface PanelPlace {
  start: number;
  top: number;
  width: number;
  height: number;
}

export interface FloatingPanelProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The head's title; it names the panel. */
  title: ReactNode;
  children?: ReactNode;
  /** Where it opens, and where a double-click on its head puts it back. Default: near the end edge. */
  defaultPlace?: Partial<PanelPlace>;
  /** Called when it's moved or resized: persist it yourself, or give a `storageKey`. */
  onPlaceChange?: (place: PanelPlace) => void;
  /** Remembers its place in localStorage under this key. */
  storageKey?: string;
  /** What it stays below: the app bar's height, say. Default `0`. */
  topOffset?: number;
  /** Default `280`. */
  minWidth?: number;
  /** Default `200`. */
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  /** This panel's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["floatingPanel"]>;
  className?: string;
}

const STEP = 16;
const BIG_STEP = 64;
const MARGIN = 24;

function readPlace(key: string | undefined): Partial<PanelPlace> | null {
  if (!key) return null;
  try {
    const saved = JSON.parse(readStored(key) ?? "null") as Partial<PanelPlace> | null;
    return saved && typeof saved === "object" ? saved : null;
  } catch {
    return null;
  }
}

/**
 * A non-modal panel over the page that stays open while you work beside it, such as an icon's
 * details while you pick others: moved by its head (or its move handle's arrow keys), resized from
 * its end corner (or that handle's arrow keys, Shift for bigger steps), kept inside the window,
 * mirrored right to left. A double-click on its head puts it back; Escape closes it. On a narrow
 * screen it's a sheet at the bottom.
 */
export function FloatingPanel({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  title,
  children,
  defaultPlace,
  onPlaceChange,
  storageKey,
  topOffset = 0,
  minWidth = 280,
  minHeight = 200,
  maxWidth,
  maxHeight,
  messages,
  className,
}: FloatingPanelProps): ReactElement {
  const strings = useMessages("floatingPanel", messages);
  const portalContainer = usePortalContainer();
  const rtl = useDirection() === "rtl";
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const open = openProp ?? ownOpen;
  // Where it's been moved to; until then, its saved or default place, worked out as it opens.
  const [moved, setPlace] = useState<PanelPlace | null>(null);
  // The drag in progress: where it started, and the place it has reached so far.
  const drag = useRef<{
    x: number;
    y: number;
    from: PanelPlace;
    to: PanelPlace;
    mode: "move" | "size";
  } | null>(null);

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };

  /** A place kept inside the window, under the offset, within the size limits. */
  const clamp = (next: PanelPlace): PanelPlace => {
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const width = Math.min(Math.max(next.width, minWidth), maxWidth ?? vw, vw);
    const height = Math.min(Math.max(next.height, minHeight), maxHeight ?? vh, vh - topOffset);
    return {
      width,
      height,
      start: Math.min(Math.max(next.start, 0), vw - width),
      top: Math.min(Math.max(next.top, topOffset), vh - height),
    };
  };
  const initial = (): PanelPlace => {
    const vw = document.documentElement.clientWidth;
    const width = defaultPlace?.width ?? 360;
    const height =
      defaultPlace?.height ?? Math.min(480, window.innerHeight - topOffset - 2 * MARGIN);
    return clamp({
      width,
      height,
      start: defaultPlace?.start ?? vw - width - MARGIN,
      top: defaultPlace?.top ?? topOffset + MARGIN,
    });
  };

  const opening = (): PanelPlace => {
    const saved = readPlace(storageKey);
    return saved ? clamp({ ...initial(), ...saved }) : initial();
  };
  const place = open && typeof window !== "undefined" ? (moved ?? opening()) : null;

  const commit = (next: PanelPlace) => {
    const kept = clamp(next);
    setPlace(kept);
    onPlaceChange?.(kept);
    if (storageKey) writeStored(storageKey, JSON.stringify(kept));
  };

  const pointerDown = (mode: "move" | "size", event: PointerEvent<HTMLElement>) => {
    if (!place || event.button !== 0) return;
    if (mode === "move" && (event.target as Element).closest("button:not([data-move])")) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // A pointer the browser doesn't track (a scripted one): the drag still follows it here.
    }
    drag.current = { x: event.clientX, y: event.clientY, from: place, to: place, mode };
  };
  const pointerMove = (event: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = (event.clientX - d.x) * (rtl ? -1 : 1);
    const dy = event.clientY - d.y;
    d.to = clamp(
      d.mode === "move"
        ? { ...d.from, start: d.from.start + dx, top: d.from.top + dy }
        : { ...d.from, width: d.from.width + dx, height: d.from.height + dy },
    );
    setPlace(d.to);
  };
  const pointerUp = () => {
    if (drag.current) commit(drag.current.to);
    drag.current = null;
  };
  const keys = (mode: "move" | "size", event: KeyboardEvent<HTMLElement>) => {
    if (!place) return;
    const step = event.shiftKey ? BIG_STEP : STEP;
    const inline = rtl ? -1 : 1;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-step * inline, 0],
      ArrowRight: [step * inline, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const [dx, dy] = delta[event.key] ?? [0, 0];
    if (!dx && !dy) return;
    event.preventDefault();
    commit(
      mode === "move"
        ? { ...place, start: place.start + dx, top: place.top + dy }
        : { ...place, width: place.width + dx, height: place.height + dy },
    );
  };

  return (
    <BaseDialog.Root open={open} onOpenChange={setOpen} modal={false} disablePointerDismissal>
      <BaseDialog.Portal container={portalContainer}>
        <BaseDialog.Popup
          className={cx("qx-floating-panel", className)}
          data-slot="floating-panel"
          style={
            place
              ? ({
                  "--qx-panel-start": `${place.start}px`,
                  "--qx-panel-top": `${place.top}px`,
                  "--qx-panel-width": `${place.width}px`,
                  "--qx-panel-height": `${place.height}px`,
                } as CSSProperties)
              : undefined
          }
        >
          {/* biome-ignore lint/a11y/noStaticElementInteractions: the head is a pointer target only; the move handle is its keyboard way */}
          <div
            className="qx-floating-panel-head"
            data-slot="floating-panel-head"
            onPointerDown={(event) => pointerDown("move", event)}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onDoubleClick={(event) => {
              if (!(event.target as Element).closest("button:not([data-move])")) commit(initial());
            }}
          >
            <IconButton
              icon={GripIcon}
              size="sm"
              tone="neutral"
              tooltip={false}
              aria-label={strings.move}
              className="qx-floating-panel-move"
              data-move=""
              onKeyDown={(event) => keys("move", event)}
            />
            <BaseDialog.Title className="qx-floating-panel-title">{title}</BaseDialog.Title>
            <BaseDialog.Close
              render={
                <IconButton
                  icon={XIcon}
                  size="sm"
                  tone="neutral"
                  tooltip={false}
                  aria-label={strings.close}
                />
              }
            />
          </div>
          <div className="qx-floating-panel-body" data-slot="floating-panel-body">
            {children}
          </div>
          <IconButton
            icon={MoveDiagonal2Icon}
            size="sm"
            tone="neutral"
            tooltip={false}
            aria-label={strings.resize}
            className="qx-floating-panel-resize"
            onPointerDown={(event) => pointerDown("size", event)}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onKeyDown={(event) => keys("size", event)}
          />
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
