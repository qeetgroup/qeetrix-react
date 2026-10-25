"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { ChevronsUpDownIcon } from "@qeetrix/icons/icons/chevrons-up-down";
import { MenuIcon } from "@qeetrix/icons/icons/menu";
import { PanelRightIcon } from "@qeetrix/icons/icons/panel-right";
import { SearchIcon } from "@qeetrix/icons/icons/search";
import {
  Children,
  type ComponentProps,
  type Context,
  createContext,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { IconButton } from "../../button/button";
import { cx } from "../../internal/cx";
import { useMediaQuery } from "../../internal/media";
import type { QeetrixMessages } from "../../internal/messages";
import { type RenderProp, renderElement } from "../../internal/render";
import { Menu, MenuCheckboxItem, MenuContent, MenuTrigger } from "../../menu/menu";
import { useMessages } from "../../provider/provider";
import { VisuallyHidden } from "../../visually-hidden/visually-hidden";
import { useShellState } from "../app-shell/app-shell";

/** Below the `expanded` window class the bar is compact, as the AppShell's sidebar becomes a drawer. */
const COMPACT = "(width < 840px)";
/** Below the `medium` window class (a phone), the panel triggers collapse into one menu too. */
const PHONE = "(width < 600px)";

export interface TopBarProps extends Omit<ComponentProps<"header">, "children"> {
  /** The suite launcher: a Menu of Qeet products behind a neutral IconButton. */
  launcher?: ReactNode;
  /** The product's mark, e.g. `<QeetLogo variant="dark" height={20} />`. */
  logo?: ReactNode;
  /** The product's name, beside the mark: "Qeet ID". */
  product: string;
  /** The identity's link home. */
  href?: string;
  /** A router link for the identity instead of `<a>`. */
  render?: RenderProp;
  /**
   * The scope, outermost first: organisation, then project or environment. Usually
   * TopBarSwitchers; a slash is drawn before each.
   */
  context?: ReactNode;
  /** The global search, centred: a TopBarSearch. Hidden below 840px. */
  search?: ReactNode;
  /** Utility IconButtons in the neutral tone, after the AppShell's panel triggers. */
  actions?: ReactNode;
  /** The account menu: an Avatar trigger, after a rule. */
  account?: ReactNode;
  /** The bar's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["topBar"]>;
}

/** An environment's colour: production, staging, development… The word says which. */
export type TopBarStatus = "neutral" | "success" | "info" | "warning" | "danger";

export interface TopBarSwitcherProps extends Omit<BaseButton.Props, "children" | "className"> {
  /** The current organisation, project or environment. */
  label: ReactNode;
  /** A small square before the label: the organisation's initials or logo. */
  mark?: ReactNode;
  /** A dot before the label, for an environment. Never colour alone: the label names it. */
  status?: TopBarStatus;
  className?: string;
}

export interface TopBarSearchProps extends Omit<BaseButton.Props, "children" | "className"> {
  /** The prompt, which is also the button's name: "Search or jump to…". */
  placeholder: string;
  /** Keys shown at the end, e.g. `["⌘", "K"]`. Wire the shortcut itself in the product. */
  shortcut?: readonly string[];
  className?: string;
}

/** Context items one by one, looking through fragments, so each gets its slash. */
function items(nodes: ReactNode): ReactNode[] {
  return Children.toArray(nodes).flatMap((node) =>
    isValidElement(node) && node.type === Fragment
      ? items((node.props as { children?: ReactNode }).children)
      : [node],
  );
}

/** What a TopBarSwitcher shows, reported to the compact bar so its one switcher can show it too. */
interface ScopeStep {
  label: ReactNode;
  mark: ReactNode;
  status: TopBarStatus | undefined;
}

/** A step's place in the scope path, and where its switcher reports what it shows. */
interface ScopeSlot {
  index: number;
  report: (index: number, step: ScopeStep | null) => void;
}

const ScopeContext: Context<ScopeSlot | null> = createContext<ScopeSlot | null>(null);

function ScopeItem({ index, report, children }: ScopeSlot & { children: ReactNode }): ReactElement {
  const slot = useMemo(() => ({ index, report }), [index, report]);
  return <ScopeContext value={slot}>{children}</ScopeContext>;
}

const same = (a: ScopeStep | undefined, b: ScopeStep | null) =>
  a === undefined || b === null
    ? a === undefined && b === null
    : a.label === b.label && a.mark === b.mark && a.status === b.status;

/**
 * The scope bar of a Qeet console: launcher, product, the scope path, search, tools and account
 * across the full width. It's black in light and dark alike (it renders the dark scheme on itself),
 * topped by a 2px Ember line.
 *
 * Below 840px it's compact, so nothing overlaps: the scope path collapses into one switcher
 * (showing the innermost step) that opens the whole path, and the search hides. Below 600px the
 * product's name also gives way to its logo, and two or more panel triggers collapse into one
 * Tools menu.
 */
export function TopBar({
  launcher,
  logo,
  product,
  href,
  render,
  context,
  search,
  actions,
  account,
  messages,
  className,
  ...props
}: TopBarProps): ReactElement {
  const shell = useShellState();
  const strings = useMessages("topBar", messages);
  const compact = useMediaQuery(COMPACT, false);
  const phone = useMediaQuery(PHONE, false);
  const path = items(context);
  // In the compact bar, each TopBarSwitcher reports what it shows; the innermost is on the bar.
  const [steps, setSteps] = useState<readonly (ScopeStep | undefined)[]>([]);
  const report = useCallback((index: number, step: ScopeStep | null) => {
    setSteps((current) => {
      if (same(current[index], step)) return current;
      const next = [...current];
      next[index] = step ?? undefined;
      return next;
    });
  }, []);
  const innermost = steps[path.length - 1];
  const collapseTools = phone && shell.drawers.length > 1;
  return (
    <header
      {...props}
      className={cx("qx-top-bar", className)}
      data-slot="top-bar"
      data-qx-color-scheme="dark"
      data-search={search != null ? "" : undefined}
      data-compact={compact ? "" : undefined}
      data-logo={logo != null ? "" : undefined}
    >
      <div className="qx-top-bar-start">
        {shell.narrow && (
          <div className="qx-top-bar-cell">
            <IconButton
              icon={MenuIcon}
              aria-label={shell.strings.open}
              tone="neutral"
              tooltip={false}
              onClick={shell.openNavigation}
            />
          </div>
        )}
        {launcher != null && (
          <div className="qx-top-bar-cell" data-slot="top-bar-launcher">
            {launcher}
          </div>
        )}
        {renderElement("a", render, {
          href,
          className: "qx-top-bar-identity",
          "data-slot": "top-bar-identity",
          children: (
            <>
              {logo}
              <span className="qx-top-bar-product">{product}</span>
            </>
          ),
        })}
        {!compact &&
          path.map((item, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: the scope is a fixed, ordered path
            <Fragment key={index}>
              <span className="qx-top-bar-slash" aria-hidden />
              {item}
            </Fragment>
          ))}
        {compact && path.length > 0 && (
          <>
            <span className="qx-top-bar-slash" aria-hidden />
            <BasePopover.Root>
              <BasePopover.Trigger
                className="qx-top-bar-switcher qx-top-bar-scope"
                data-slot="top-bar-scope"
              >
                {innermost && <VisuallyHidden>{strings.scope}</VisuallyHidden>}
                {innermost?.mark != null && (
                  <span className="qx-top-bar-mark" aria-hidden>
                    <span className="qx-top-bar-mark-content">{innermost.mark}</span>
                  </span>
                )}
                {innermost?.status && (
                  <span className="qx-top-bar-status" data-status={innermost.status} aria-hidden />
                )}
                <span className="qx-top-bar-switcher-label">
                  {innermost ? innermost.label : strings.scope}
                </span>
                <ChevronsUpDownIcon
                  shape="round"
                  size={14}
                  aria-hidden
                  className="qx-top-bar-caret"
                />
              </BasePopover.Trigger>
              {/* Kept mounted while closed, so each switcher can report what it shows. */}
              <BasePopover.Portal keepMounted>
                <BasePopover.Positioner
                  align="start"
                  sideOffset={4}
                  className="qx-top-bar-scope-positioner"
                >
                  <BasePopover.Popup
                    className="qx-top-bar-scope-popup"
                    data-slot="top-bar-scope-popup"
                    aria-label={strings.scope}
                  >
                    {path.map((item, index) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: the scope is a fixed, ordered path
                      <ScopeItem key={index} index={index} report={report}>
                        {item}
                      </ScopeItem>
                    ))}
                  </BasePopover.Popup>
                </BasePopover.Positioner>
              </BasePopover.Portal>
            </BasePopover.Root>
          </>
        )}
      </div>
      {search != null && (
        <div className="qx-top-bar-search" data-slot="top-bar-search">
          {search}
        </div>
      )}
      <div className="qx-top-bar-end">
        {collapseTools && (
          <span
            className="qx-top-bar-tool"
            data-badge={shell.drawers.some((drawer) => drawer.badge) ? "" : undefined}
          >
            <Menu>
              <MenuTrigger
                render={
                  <IconButton
                    icon={PanelRightIcon}
                    aria-label={shell.strings.tools}
                    data-panel-open={shell.activeDrawer !== null ? "" : undefined}
                    tone="neutral"
                    tooltip={false}
                    className="qx-top-bar-tools-trigger"
                  />
                }
              />
              <MenuContent align="end">
                {shell.drawers.map((drawer) => (
                  <MenuCheckboxItem
                    key={drawer.id}
                    checked={shell.activeDrawer === drawer.id}
                    onCheckedChange={() => shell.toggleDrawer(drawer.id)}
                  >
                    {drawer.label}
                  </MenuCheckboxItem>
                ))}
              </MenuContent>
            </Menu>
          </span>
        )}
        {!collapseTools && shell.drawers.length > 0 && (
          // biome-ignore lint/a11y/useSemanticElements: a fieldset is for form controls; this is a set of buttons
          <div role="group" aria-label={shell.strings.tools} className="qx-top-bar-tools">
            {shell.drawers.map((drawer) => (
              <span
                key={drawer.id}
                className="qx-top-bar-tool"
                data-badge={drawer.badge ? "" : undefined}
              >
                <IconButton
                  icon={drawer.icon}
                  aria-label={drawer.label}
                  aria-pressed={shell.activeDrawer === drawer.id}
                  tone="neutral"
                  onClick={() => shell.toggleDrawer(drawer.id)}
                />
              </span>
            ))}
          </div>
        )}
        {actions}
        {account != null && (
          <>
            <span className="qx-top-bar-rule" aria-hidden />
            {account}
          </>
        )}
      </div>
    </header>
  );
}

/**
 * A step of the TopBar's scope path: the current organisation or environment, which opens a Menu
 * to switch it. Use it as the trigger: `<MenuTrigger render={<TopBarSwitcher label="Acme" />} />`.
 * In the compact bar, the innermost step's label, mark and status show on the bar's one switcher.
 */
export function TopBarSwitcher({
  label,
  mark,
  status,
  className,
  ...props
}: TopBarSwitcherProps): ReactElement {
  const slot = use(ScopeContext);
  useEffect(() => {
    if (!slot) return;
    slot.report(slot.index, { label, mark, status });
    return () => slot.report(slot.index, null);
  }, [slot, label, mark, status]);
  return (
    <BaseButton
      {...props}
      className={cx("qx-top-bar-switcher", className)}
      data-slot="top-bar-switcher"
    >
      {mark != null && (
        <span className="qx-top-bar-mark" aria-hidden>
          <span className="qx-top-bar-mark-content">{mark}</span>
        </span>
      )}
      {status && <span className="qx-top-bar-status" data-status={status} aria-hidden />}
      <span className="qx-top-bar-switcher-label">{label}</span>
      <ChevronsUpDownIcon shape="round" size={14} aria-hidden className="qx-top-bar-caret" />
    </BaseButton>
  );
}

/**
 * The global search in the TopBar: a field-shaped button that opens the product's search or command
 * palette, with its shortcut shown at the end.
 */
export function TopBarSearch({
  placeholder,
  shortcut,
  className,
  ...props
}: TopBarSearchProps): ReactElement {
  return (
    <BaseButton
      {...props}
      className={cx("qx-top-bar-search-trigger", className)}
      data-slot="top-bar-search-trigger"
    >
      <SearchIcon shape="round" size={16} aria-hidden className="qx-top-bar-search-icon" />
      <span className="qx-top-bar-search-text">{placeholder}</span>
      {shortcut && shortcut.length > 0 && (
        <span className="qx-top-bar-keys" aria-hidden>
          {shortcut.map((key) => (
            <kbd key={key} className="qx-top-bar-key">
              {key}
            </kbd>
          ))}
        </span>
      )}
    </BaseButton>
  );
}
