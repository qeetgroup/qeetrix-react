"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import {
  type Context,
  cloneElement,
  createContext,
  type ReactElement,
  type ReactNode,
  use,
  useId,
  useRef,
  useState,
} from "react";

export interface TooltipProps extends Omit<BaseTooltip.Root.Props, "children"> {
  /** The text. Short, never interactive and never essential. */
  content: ReactNode;
  /** The trigger: one element that takes a ref and props, such as an IconButton. */
  children: ReactElement;
  /** The trigger's side to open on. Default `top`; it flips when there is no room. */
  side?: BaseTooltip.Positioner.Props["side"];
  /** Alignment along that side. Default `center`. */
  align?: BaseTooltip.Positioner.Props["align"];
  /** Distance from the trigger, in pixels. Default `6`. */
  sideOffset?: number;
  /**
   * Hover time before it opens, in milliseconds; keyboard focus opens it at once. Default `500`, or
   * TooltipProvider's `delay`.
   */
  delay?: number;
  /**
   * Time before it closes after the pointer leaves, in milliseconds. Default `0`, or
   * TooltipProvider's `closeDelay`.
   */
  closeDelay?: number;
}

export interface TooltipProviderProps extends BaseTooltip.Provider.Props {
  /** Hover time before a tooltip in the group opens, in milliseconds. Default `500`. */
  delay?: number | undefined;
  /**
   * Time before a tooltip in the group closes after the pointer leaves, in milliseconds.
   * Default `0`.
   */
  closeDelay?: number | undefined;
}

/** The nearest TooltipProvider's hover delay, so a Tooltip's own default doesn't mask it. */
const ProviderDelay: Context<number | undefined> = createContext<number | undefined>(undefined);

/**
 * Groups tooltips (an app, a toolbar): once one is open, moving to a neighbour opens it at once.
 */
export function TooltipProvider({
  delay = 500,
  closeDelay = 0,
  ...props
}: TooltipProviderProps): ReactElement {
  return (
    <ProviderDelay value={delay}>
      <BaseTooltip.Provider {...props} delay={delay} closeDelay={closeDelay} />
    </ProviderDelay>
  );
}

/** Text as a screen reader reads it: trimmed, with runs of white space collapsed. */
const spoken = (text: unknown): string | null =>
  typeof text === "string" ? text.trim().replace(/\s+/g, " ") : null;

/**
 * A short label for a control, most often an icon-only button:
 * `<Tooltip content="Download invoice"><IconButton … /></Tooltip>`. It doesn't appear on touch.
 *
 * While it's open, it describes its trigger (`role="tooltip"`, linked by `aria-describedby`). When
 * its text only repeats the trigger's name, as on an IconButton that shows its `aria-label`, it
 * isn't linked, so the name isn't read twice.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  align,
  sideOffset = 6,
  delay,
  closeDelay,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: TooltipProps): ReactElement {
  const providerDelay = use(ProviderDelay);
  const popupId = useId();
  // Usually a button; any element the child renders works the same.
  const trigger = useRef<HTMLButtonElement>(null);
  const [shown, setShown] = useState(defaultOpen);
  // The trigger's name: its `aria-label` prop, or else what the trigger read when it last opened
  // (its text, say), so a tooltip that only repeats it isn't linked.
  const [readName, setReadName] = useState<string | null>(null);
  const own = children.props as { "aria-label"?: unknown; "aria-describedby"?: unknown };
  const text = spoken(content);
  const repeats = text !== null && text === (spoken(own["aria-label"]) ?? readName);
  const open = openProp ?? shown;

  const handleOpenChange: TooltipProps["onOpenChange"] = (next, details) => {
    onOpenChange?.(next, details);
    if (details.isCanceled) return;
    const element = trigger.current;
    if (next && element) {
      setReadName(spoken(element.getAttribute("aria-label") ?? element.textContent));
    }
    setShown(next);
  };

  const describedBy =
    open && !repeats
      ? [spoken(own["aria-describedby"]), popupId].filter(Boolean).join(" ")
      : undefined;

  return (
    <BaseTooltip.Root
      {...props}
      open={openProp}
      defaultOpen={defaultOpen}
      onOpenChange={handleOpenChange}
    >
      <BaseTooltip.Trigger
        ref={trigger}
        // The child's own props win over the trigger's, so the description joins them there.
        render={
          describedBy
            ? cloneElement(children as ReactElement<{ "aria-describedby"?: string }>, {
                "aria-describedby": describedBy,
              })
            : children
        }
        delay={delay ?? providerDelay ?? 500}
        closeDelay={closeDelay}
      />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner
          side={side}
          align={align}
          sideOffset={sideOffset}
          className="qx-tooltip-positioner"
          data-slot="tooltip-positioner"
        >
          <BaseTooltip.Popup
            id={popupId}
            role="tooltip"
            className="qx-tooltip"
            data-slot="tooltip-popup"
          >
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
