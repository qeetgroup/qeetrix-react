"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import { PanelLeftCloseIcon } from "@qeetrix/icons/icons/panel-left-close";
import { PanelLeftOpenIcon } from "@qeetrix/icons/icons/panel-left-open";
import { XIcon } from "@qeetrix/icons/icons/x";
import {
  type ComponentProps,
  type Context,
  type CSSProperties,
  createContext,
  type ReactElement,
  type ReactNode,
  use,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { IconButton } from "../../button/button";
import type { QeetrixIcon } from "../../internal/control";
import { cx } from "../../internal/cx";
import { useMediaQuery } from "../../internal/media";
import type { QeetrixMessages } from "../../internal/messages";
import { mergeRefs } from "../../internal/refs";
import { fill } from "../../internal/template";
import { useMessages, usePortalContainer } from "../../provider/provider";
import { SkipLink } from "../../skip-link/skip-link";
import { Tooltip } from "../../tooltip/tooltip";

/** The `expanded` window class (tokens `breakpoint.expanded`): the sidebar is a column from here. */
const WIDE = "(width >= 840px)";
/** How long the pointer rests on the rail before it expands over the page. */
const PEEK_DELAY = 200;

/** The frame's density; `inherit` leaves it to the page. */
export type AppShellDensity = "compact" | "default" | "comfortable" | "inherit";

/** An end-edge panel: help, the assistant, activity. */
export interface AppShellDrawer {
  id: string;
  /** The trigger's label and the panel's title. */
  label: string;
  /** The trigger's icon, from `@qeetrix/icons`. */
  icon: QeetrixIcon;
  /** The panel's content. */
  content: ReactNode;
  /** A dot on the trigger: something new inside. */
  badge?: boolean;
  /** The panel's width in px, when it opens. Default `320`. */
  width?: number;
  /** The narrowest it can be resized to. Default: `width`. */
  minWidth?: number;
  /** The widest it can be resized to. Default `720`. */
  maxWidth?: number;
  /**
   * A handle on the panel's start edge to resize it, as a window splitter: drag it, or focus it
   * and use the arrow keys (Home and End for the narrowest and the widest).
   */
  resizable?: boolean;
  /** Called with the new width after a resize, e.g. to remember it. */
  onWidthChange?: (width: number) => void;
}

export interface AppShellProps extends Omit<ComponentProps<"div">, "children"> {
  /** The global bar: a TopBar. */
  topBar?: ReactNode;
  /** The navigation: a Sidebar. */
  sidebar?: ReactNode;
  /** End-edge panels: help, the assistant, activity. Their triggers sit in the TopBar. */
  drawers?: AppShellDrawer[];
  /** The open panel's id, or `null`, controlled. */
  activeDrawer?: string | null;
  /** The open panel's id when uncontrolled, or `null` for none. Default `null`. */
  defaultActiveDrawer?: string | null;
  /** Called with the panel that opens, or `null` when it closes. */
  onActiveDrawerChange?: (id: string | null) => void;
  /**
   * Page banners: Alerts with `variant="banner"`, about the whole app (maintenance, a trial ending,
   * viewing as someone else). Edge to edge across the page, under the bar, above everything else.
   */
  banners?: ReactNode;
  /** Page messages (Alerts) above the page header. */
  notifications?: ReactNode;
  /** The frame's density. Default `compact`: consoles are dense (design rules §15). */
  density?: AppShellDensity;
  /** The page: a PageHeader and PageContent. */
  children?: ReactNode;
  /** Whether the sidebar is collapsed to its icon rail, controlled. */
  sidebarCollapsed?: boolean;
  /** The initial collapsed state when uncontrolled. Default `false`. */
  defaultSidebarCollapsed?: boolean;
  /** Called with the new collapsed state. Persist it in the product, e.g. the user's settings. */
  onSidebarCollapsedChange?: (collapsed: boolean) => void;
  /** The main region's id, which the built-in skip link targets. Default `main`. */
  mainId?: string;
  /**
   * A shell inside a page (a docs preview, a story, an in-product preview): it fills its box
   * (give the box a height) instead of the window, the page scrolls inside it, the narrow layout
   * follows the box's width, and the navigation drawer opens inside it. It renders no `<main>`
   * and no skip link, which belong to the page around it.
   */
  embedded?: boolean;
  /** The shell's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["appShell"]>;
}

interface ShellState {
  /** The sidebar shows as its rail (collapsed, and not peeking). */
  collapsed: boolean;
  /** This sidebar is the narrow-screen drawer's copy. */
  inDrawer: boolean;
  /** Below the `expanded` window class. */
  narrow: boolean;
  /** Fix the sidebar open. */
  expand: () => void;
  /** Close the narrow-screen navigation drawer. */
  closeDrawer: () => void;
  /** Open the narrow-screen navigation drawer. */
  openNavigation: () => void;
  drawers: AppShellDrawer[];
  activeDrawer: string | null;
  toggleDrawer: (id: string) => void;
  strings: QeetrixMessages["appShell"];
}

const ShellContext: Context<ShellState | null> = createContext<ShellState | null>(null);

const outside: ShellState = {
  collapsed: false,
  inDrawer: false,
  narrow: false,
  expand: () => {},
  closeDrawer: () => {},
  openNavigation: () => {},
  drawers: [],
  activeDrawer: null,
  toggleDrawer: () => {},
  strings: {
    collapse: "",
    expand: "",
    open: "",
    navigation: "",
    tools: "",
    closePanel: "",
    resizePanel: "",
  },
};

/** The shell's state, for its own parts. Outside an AppShell, a sidebar is expanded. */
export function useShellState(): ShellState {
  return use(ShellContext) ?? outside;
}

export interface AppShellState {
  /** The sidebar is showing as its icon rail. */
  collapsed: boolean;
}

/** The AppShell's state, for content inside its sidebar or bar. */
export function useAppShell(): AppShellState {
  const { collapsed, inDrawer } = useShellState();
  return { collapsed: collapsed && !inDrawer };
}

/**
 * The frame of a Qeet console: the black scope bar across the full width; the ruled navigation
 * column, which collapses to a 48px icon rail that expands while hovered or focused; the page; and
 * a panel on the end edge that the bar's tools open. Seams are 1px rules, never shadows. Compact by
 * default. Without a `topBar`, the navigation and the panel start at the top of the window.
 */
export function AppShell({
  topBar,
  sidebar,
  drawers = [],
  activeDrawer,
  defaultActiveDrawer = null,
  onActiveDrawerChange,
  banners,
  notifications,
  density = "compact",
  children,
  sidebarCollapsed,
  defaultSidebarCollapsed = false,
  onSidebarCollapsedChange,
  mainId = "main",
  embedded = false,
  messages,
  className,
  ref,
  ...props
}: AppShellProps): ReactElement {
  const strings = useMessages("appShell", messages);
  const skip = useMessages("skipLink");
  const Main = embedded ? "div" : "main";
  const wideWindow = useMediaQuery(WIDE, true);
  const portalContainer = usePortalContainer();
  // Embedded, the box's width decides the layout, as the CSS's container queries do.
  const root = useRef<HTMLDivElement>(null);
  const [wideBox, setWideBox] = useState(true);
  useEffect(() => {
    const el = root.current;
    if (!embedded || !el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) =>
      setWideBox((entry?.contentRect.width ?? 0) >= 840),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [embedded]);
  const wide = embedded ? wideBox : wideWindow;
  const rtl = useDirection() === "rtl";
  const panelTitle = useId();

  const [ownCollapsed, setOwnCollapsed] = useState(defaultSidebarCollapsed);
  const collapsed = sidebarCollapsed ?? ownCollapsed;
  const setCollapsed = (next: boolean) => {
    if (sidebarCollapsed === undefined) setOwnCollapsed(next);
    onSidebarCollapsedChange?.(next);
  };

  const [ownDrawer, setOwnDrawer] = useState(defaultActiveDrawer);
  const active = activeDrawer === undefined ? ownDrawer : activeDrawer;
  const setActive = (next: string | null) => {
    if (activeDrawer === undefined) setOwnDrawer(next);
    onActiveDrawerChange?.(next);
  };
  const panel = drawers.find((drawer) => drawer.id === active);
  // Each panel's width once someone has resized it, by id.
  const [widths, setWidths] = useState<Record<string, number>>({});

  const [navOpen, setNavOpen] = useState(false);

  // The rail expands over the page while hovered (after a rest) or while focus is inside it.
  const [peek, setPeek] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const startPeek = () => {
    if (!collapsed) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPeek(true), PEEK_DELAY);
  };
  const endPeek = () => {
    window.clearTimeout(timer.current);
    setPeek(false);
  };

  const shell: ShellState = {
    collapsed: collapsed && !peek,
    inDrawer: false,
    narrow: !wide,
    expand: () => {
      endPeek();
      setCollapsed(false);
    },
    closeDrawer: () => setNavOpen(false),
    openNavigation: () => setNavOpen(true),
    drawers,
    activeDrawer: active,
    toggleDrawer: (id) => setActive(active === id ? null : id),
    strings,
  };

  const CollapseIcon = collapsed ? PanelLeftOpenIcon : PanelLeftCloseIcon;
  const collapseControl = (
    <button
      type="button"
      className="qx-app-shell-collapse"
      data-slot="app-shell-collapse"
      aria-expanded={!collapsed}
      onClick={() => {
        endPeek();
        setCollapsed(!collapsed);
      }}
    >
      <CollapseIcon shape="round" size={16} aria-hidden className="qx-app-shell-collapse-icon" />
      <span className="qx-app-shell-collapse-label">
        {collapsed ? strings.expand : strings.collapse}
      </span>
    </button>
  );

  return (
    <ShellContext value={shell}>
      <div
        {...props}
        ref={mergeRefs(ref, root)}
        className={cx("qx-app-shell", className)}
        data-slot="app-shell"
        data-embedded={embedded ? "" : undefined}
        data-qx-density={density === "inherit" ? undefined : density}
        data-collapsed={collapsed ? "" : undefined}
        data-drawer-open={panel ? "" : undefined}
      >
        {!embedded && <SkipLink href={`#${mainId}`}>{skip.label}</SkipLink>}
        {topBar != null && (
          <div className="qx-app-shell-top" data-slot="app-shell-top">
            {topBar}
          </div>
        )}
        {sidebar != null && (
          // biome-ignore lint/a11y/noStaticElementInteractions: hover and focus only preview the rail; every action is on the links and buttons inside
          <div
            className="qx-app-shell-nav"
            data-slot="app-shell-nav"
            data-peek={peek ? "" : undefined}
            onPointerEnter={startPeek}
            onPointerLeave={endPeek}
            onFocus={() => collapsed && setPeek(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPeek(false);
            }}
          >
            <div className="qx-app-shell-nav-panel" data-slot="app-shell-nav-panel">
              <div className="qx-app-shell-nav-body" data-slot="app-shell-nav-body">
                {sidebar}
              </div>
              <div className="qx-app-shell-nav-foot" data-slot="app-shell-nav-foot">
                <Tooltip content={strings.expand} side="inline-end" disabled={!collapsed || peek}>
                  {collapseControl}
                </Tooltip>
              </div>
            </div>
          </div>
        )}
        <Main
          {...(embedded ? {} : { id: mainId, tabIndex: -1 })}
          className="qx-app-shell-main"
          data-slot="app-shell-main"
        >
          {banners != null && (
            <div className="qx-app-shell-banners" data-slot="app-shell-banners">
              {banners}
            </div>
          )}
          {notifications != null && (
            <div className="qx-app-shell-notifications" data-slot="app-shell-notifications">
              {notifications}
            </div>
          )}
          {children}
        </Main>
        {panel && (
          <aside
            className="qx-app-shell-panel"
            data-slot="app-shell-panel"
            aria-labelledby={panelTitle}
            style={
              {
                "--qx-app-shell-panel-width": `${widths[panel.id] ?? panel.width ?? 320}px`,
              } as CSSProperties
            }
          >
            {panel.resizable && (
              <PanelResizer
                panel={panel}
                width={widths[panel.id] ?? panel.width ?? 320}
                label={fill(strings.resizePanel, { panel: panel.label })}
                onResize={(next) => {
                  setWidths((known) => ({ ...known, [panel.id]: next }));
                  panel.onWidthChange?.(next);
                }}
              />
            )}
            <div className="qx-app-shell-panel-header" data-slot="app-shell-panel-header">
              <h2
                id={panelTitle}
                className="qx-app-shell-panel-title"
                data-slot="app-shell-panel-title"
              >
                {panel.label}
              </h2>
              <IconButton
                icon={XIcon}
                aria-label={strings.closePanel}
                size="sm"
                tone="neutral"
                tooltip={false}
                onClick={() => setActive(null)}
              />
            </div>
            <div className="qx-app-shell-panel-body" data-slot="app-shell-panel-body">
              {panel.content}
            </div>
          </aside>
        )}
        {sidebar != null && (
          <BaseDrawer.Root
            open={navOpen && !wide}
            onOpenChange={setNavOpen}
            swipeDirection={rtl ? "right" : "left"}
          >
            <BaseDrawer.Portal container={embedded ? root : portalContainer}>
              <BaseDrawer.Backdrop className="qx-app-shell-backdrop" />
              <BaseDrawer.Viewport className="qx-app-shell-viewport">
                <BaseDrawer.Popup
                  className="qx-app-shell-drawer"
                  data-slot="app-shell-drawer"
                  data-qx-density={density === "inherit" ? undefined : density}
                  aria-label={strings.navigation}
                >
                  <ShellContext value={{ ...shell, collapsed: false, inDrawer: true }}>
                    {sidebar}
                  </ShellContext>
                </BaseDrawer.Popup>
              </BaseDrawer.Viewport>
            </BaseDrawer.Portal>
          </BaseDrawer.Root>
        )}
      </div>
    </ShellContext>
  );
}

const RESIZE_STEP = 16;

/**
 * A panel's resize handle on its start edge: a window splitter (separator) that reports the width,
 * moved by dragging or by the arrow keys. Moving it towards the page's start widens the panel, in
 * either reading direction.
 */
function PanelResizer({
  panel,
  width,
  label,
  onResize,
}: {
  panel: AppShellDrawer;
  width: number;
  label: string;
  onResize: (width: number) => void;
}): ReactElement {
  const min = panel.minWidth ?? panel.width ?? 320;
  const max = Math.max(min, panel.maxWidth ?? 720);
  const clamp = (value: number) => Math.round(Math.min(max, Math.max(min, value)));
  const rtl = (el: Element) => getComputedStyle(el).direction === "rtl";
  return (
    // biome-ignore lint/a11y/useSemanticElements: a focusable window splitter, which <hr> can't be
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={width}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      className="qx-app-shell-resizer"
      data-slot="app-shell-resizer"
      onKeyDown={(event) => {
        const towardsStart = rtl(event.currentTarget) ? "ArrowRight" : "ArrowLeft";
        const towardsEnd = rtl(event.currentTarget) ? "ArrowLeft" : "ArrowRight";
        const next =
          event.key === towardsStart
            ? width + RESIZE_STEP
            : event.key === towardsEnd
              ? width - RESIZE_STEP
              : event.key === "Home"
                ? min
                : event.key === "End"
                  ? max
                  : undefined;
        if (next === undefined) return;
        event.preventDefault();
        onResize(clamp(next));
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        const handle = event.currentTarget;
        const from = event.clientX;
        const sign = rtl(handle) ? 1 : -1;
        handle.setPointerCapture(event.pointerId);
        const move = (moved: PointerEvent) =>
          onResize(clamp(width + sign * (moved.clientX - from)));
        const end = () => {
          handle.removeEventListener("pointermove", move);
          handle.removeEventListener("pointerup", end);
          handle.removeEventListener("pointercancel", end);
        };
        handle.addEventListener("pointermove", move);
        handle.addEventListener("pointerup", end);
        handle.addEventListener("pointercancel", end);
      }}
    />
  );
}
