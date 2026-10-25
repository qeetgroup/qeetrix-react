"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import { PanelLeftIcon } from "@qeetrix/icons/icons/panel-left";
import { PanelLeftCloseIcon } from "@qeetrix/icons/icons/panel-left-close";
import { PanelLeftOpenIcon } from "@qeetrix/icons/icons/panel-left-open";
import {
  type ComponentProps,
  type Context,
  createContext,
  type ReactElement,
  type ReactNode,
  use,
  useState,
} from "react";
import { IconButton } from "../../button/button";
import { cx } from "../../internal/cx";
import { useMediaQuery } from "../../internal/media";
import type { QeetrixMessages } from "../../internal/messages";
import { useMessages } from "../../provider/provider";
import { SkipLink } from "../../skip-link/skip-link";

/** The `expanded` window class (tokens `breakpoint.expanded`): the sidebar is a column from here. */
const WIDE = "(width >= 840px)";

export interface AppShellProps extends Omit<ComponentProps<"div">, "children"> {
  /** The navigation: a Sidebar. */
  sidebar: ReactNode;
  /** The start of the header, usually a Breadcrumb. */
  header?: ReactNode;
  /** The end of the header: environment badge, help, notifications. */
  actions?: ReactNode;
  /** The page. */
  children?: ReactNode;
  /** Whether the sidebar is collapsed to its icon rail, controlled. */
  sidebarCollapsed?: boolean;
  /** The initial collapsed state when uncontrolled. Default `false`. */
  defaultSidebarCollapsed?: boolean;
  /** Called with the new collapsed state. Persist it in the product, e.g. the user's settings. */
  onSidebarCollapsedChange?: (collapsed: boolean) => void;
  /** The main region's id, which the built-in skip link targets. Default `main`. */
  mainId?: string;
  /** The toggle's labels, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["appShell"]>;
}

interface ShellState {
  /** The sidebar column is a rail. */
  collapsed: boolean;
  /** This sidebar is the narrow-screen drawer's copy. */
  inDrawer: boolean;
  expand: () => void;
  closeDrawer: () => void;
}

const ShellContext: Context<ShellState> = createContext<ShellState>({
  collapsed: false,
  inDrawer: false,
  expand: () => {},
  closeDrawer: () => {},
});

/** The shell's state, for a sidebar's own parts. A sidebar outside an AppShell is expanded. */
export function useShellState(): ShellState {
  return use(ShellContext);
}

export interface AppShellState {
  /** The sidebar is showing as its icon rail: a header or footer can show a compact form. */
  collapsed: boolean;
}

/** The AppShell's state, for content inside its sidebar. */
export function useAppShell(): AppShellState {
  const { collapsed, inDrawer } = use(ShellContext);
  return { collapsed: collapsed && !inDrawer };
}

/**
 * The frame of a Qeet console (07-components.md, C1): the sidebar, a sticky header and the page. On
 * wide screens the sidebar is a column that collapses to an icon rail; on narrow screens it opens
 * as a drawer from the start edge.
 */
export function AppShell({
  sidebar,
  header,
  actions,
  children,
  sidebarCollapsed,
  defaultSidebarCollapsed = false,
  onSidebarCollapsedChange,
  mainId = "main",
  messages,
  className,
  ...props
}: AppShellProps): ReactElement {
  const strings = useMessages("appShell", messages);
  const skip = useMessages("skipLink");
  const wide = useMediaQuery(WIDE, true);
  const rtl = useDirection() === "rtl";
  const [ownCollapsed, setOwnCollapsed] = useState(defaultSidebarCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const collapsed = sidebarCollapsed ?? ownCollapsed;
  const setCollapsed = (next: boolean) => {
    if (sidebarCollapsed === undefined) setOwnCollapsed(next);
    onSidebarCollapsedChange?.(next);
  };
  const shell: ShellState = {
    collapsed,
    inDrawer: false,
    expand: () => setCollapsed(false),
    closeDrawer: () => setDrawerOpen(false),
  };
  const Icon = wide ? (collapsed ? PanelLeftOpenIcon : PanelLeftCloseIcon) : PanelLeftIcon;
  const label = wide ? (collapsed ? strings.expand : strings.collapse) : strings.open;
  return (
    <ShellContext value={shell}>
      <div
        {...props}
        className={cx("qx-app-shell", className)}
        data-slot="app-shell"
        data-collapsed={collapsed ? "" : undefined}
      >
        <SkipLink href={`#${mainId}`}>{skip.label}</SkipLink>
        <div className="qx-app-shell-sidebar" data-slot="app-shell-sidebar">
          {sidebar}
        </div>
        <div className="qx-app-shell-body">
          <header className="qx-app-shell-header" data-slot="app-shell-header">
            <IconButton
              icon={Icon}
              aria-label={label}
              aria-expanded={wide ? !collapsed : drawerOpen}
              onClick={() => (wide ? setCollapsed(!collapsed) : setDrawerOpen(true))}
              tone="neutral"
              className="qx-app-shell-toggle"
            />
            <div className="qx-app-shell-header-start">{header}</div>
            {actions != null && (
              <div className="qx-app-shell-actions" data-slot="app-shell-actions">
                {actions}
              </div>
            )}
          </header>
          <main id={mainId} tabIndex={-1} className="qx-app-shell-main" data-slot="app-shell-main">
            {children}
          </main>
        </div>
        <BaseDrawer.Root
          open={drawerOpen && !wide}
          onOpenChange={setDrawerOpen}
          swipeDirection={rtl ? "right" : "left"}
        >
          <BaseDrawer.Portal>
            <BaseDrawer.Backdrop className="qx-app-shell-backdrop" />
            <BaseDrawer.Viewport className="qx-app-shell-viewport">
              <BaseDrawer.Popup
                className="qx-app-shell-drawer"
                data-slot="app-shell-drawer"
                aria-label={strings.navigation}
              >
                <ShellContext value={{ ...shell, inDrawer: true }}>{sidebar}</ShellContext>
              </BaseDrawer.Popup>
            </BaseDrawer.Viewport>
          </BaseDrawer.Portal>
        </BaseDrawer.Root>
      </div>
    </ShellContext>
  );
}
