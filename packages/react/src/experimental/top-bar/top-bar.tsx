"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import { ChevronsUpDownIcon } from "@qeetrix/icons/icons/chevrons-up-down";
import { MenuIcon } from "@qeetrix/icons/icons/menu";
import { SearchIcon } from "@qeetrix/icons/icons/search";
import {
  Children,
  type ComponentProps,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { IconButton } from "../../button/button";
import { cx } from "../../internal/cx";
import { type RenderProp, renderElement } from "../../internal/render";
import { useShellState } from "../app-shell/app-shell";

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

/**
 * The scope bar of a Qeet console (07-components.md, C1): launcher, product, the scope path,
 * search, tools and account across the full width. It's black in light and dark alike (it renders
 * the dark scheme on itself), topped by a 2px Ember line.
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
  className,
  ...props
}: TopBarProps): ReactElement {
  const shell = useShellState();
  return (
    <header
      {...props}
      className={cx("qx-top-bar", className)}
      data-slot="top-bar"
      data-qx-color-scheme="dark"
      data-search={search != null ? "" : undefined}
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
        {items(context).map((item, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: the scope is a fixed, ordered path
          <Fragment key={index}>
            <span className="qx-top-bar-slash" aria-hidden />
            {item}
          </Fragment>
        ))}
      </div>
      {search != null && (
        <div className="qx-top-bar-search" data-slot="top-bar-search">
          {search}
        </div>
      )}
      <div className="qx-top-bar-end">
        {shell.drawers.length > 0 && (
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
 */
export function TopBarSwitcher({
  label,
  mark,
  status,
  className,
  ...props
}: TopBarSwitcherProps): ReactElement {
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
