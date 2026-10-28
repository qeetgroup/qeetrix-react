"use client";

import { NavigationMenu as BaseNav } from "@base-ui/react/navigation-menu";
import { ChevronDownIcon } from "@qeetrix/icons/icons/chevron-down";
import { MenuIcon } from "@qeetrix/icons/icons/menu";
import { XIcon } from "@qeetrix/icons/icons/x";
import {
  type ComponentProps,
  type Context,
  createContext,
  type ReactElement,
  type ReactNode,
  use,
  useId,
  useState,
} from "react";
import { IconButton } from "../../button/button";
import { cx } from "../../internal/cx";
import type { QeetrixMessages } from "../../internal/messages";
import { type RenderProp, renderElement } from "../../internal/render";
import { useMessages, usePortalContainer } from "../../provider/provider";

/** Where the navigation is drawn: across the bar, or stacked in the narrow-screen menu. */
const ModeContext: Context<"bar" | "menu"> = createContext<"bar" | "menu">("bar");

export interface SiteHeaderProps extends Omit<ComponentProps<"header">, "children"> {
  /** The wordmark, a link home. */
  brand: ReactNode;
  /** A SiteNav: the site's 5 to 7 sections. */
  navigation?: ReactNode;
  /** Quiet links at the end: Docs, Sign in. */
  utilities?: ReactNode;
  /** The one primary action, last: a LinkButton, "Start free". */
  action?: ReactNode;
  /** This header's strings, over QeetrixProvider's and the English defaults. */
  messages?: Partial<QeetrixMessages["siteHeader"]>;
}

/**
 * The bar across a website (welcoming and marketing pages, docs), not a console's TopBar: the
 * wordmark, the site's sections with their panels, quiet utility links and one primary action, on
 * the 2px Ember line. On a narrow screen the sections and utilities move into a menu the menu
 * button opens under the bar.
 */
export function SiteHeader({
  brand,
  navigation,
  utilities,
  action,
  messages,
  className,
  ...props
}: SiteHeaderProps): ReactElement {
  const strings = useMessages("siteHeader", messages);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  return (
    <header {...props} className={cx("qx-site-header", className)} data-slot="site-header">
      <div className="qx-site-header-bar">
        <div className="qx-site-header-brand">{brand}</div>
        {navigation != null && <div className="qx-site-header-nav">{navigation}</div>}
        <div className="qx-site-header-end">
          {utilities != null && <div className="qx-site-header-utilities">{utilities}</div>}
          {action}
          {(navigation != null || utilities != null) && (
            <IconButton
              icon={open ? XIcon : MenuIcon}
              aria-label={strings.menu}
              aria-expanded={open}
              aria-controls={menuId}
              tone="neutral"
              tooltip={false}
              className="qx-site-header-toggle"
              onClick={() => setOpen(!open)}
            />
          )}
        </div>
      </div>
      {open && (
        <div id={menuId} className="qx-site-header-menu" data-slot="site-header-menu">
          <ModeContext value="menu">
            {navigation}
            {utilities != null && <div className="qx-site-header-menu-utilities">{utilities}</div>}
          </ModeContext>
        </div>
      )}
    </header>
  );
}

export interface SiteNavProps {
  /** Names the navigation: "Main". */
  "aria-label": string;
  /** SiteNavItems. */
  children?: ReactNode;
  className?: string;
}

/**
 * The site's sections: links, and triggers that open a panel of links under the bar. The arrow
 * keys move between them, Escape closes a panel and returns to its trigger.
 */
export function SiteNav({ "aria-label": label, children, className }: SiteNavProps): ReactElement {
  const mode = use(ModeContext);
  const portalContainer = usePortalContainer();
  if (mode === "menu") {
    return (
      <nav aria-label={label} className="qx-site-nav" data-mode="menu">
        <ul className="qx-site-nav-list">{children}</ul>
      </nav>
    );
  }
  return (
    <BaseNav.Root aria-label={label} className={cx("qx-site-nav", className)} data-slot="site-nav">
      <BaseNav.List className="qx-site-nav-list">{children}</BaseNav.List>
      <BaseNav.Portal container={portalContainer}>
        <BaseNav.Positioner className="qx-site-nav-positioner" sideOffset={8} align="start">
          <BaseNav.Popup className="qx-site-nav-popup">
            <BaseNav.Viewport className="qx-site-nav-viewport" />
          </BaseNav.Popup>
        </BaseNav.Positioner>
      </BaseNav.Portal>
    </BaseNav.Root>
  );
}

export interface SiteNavItemProps {
  /** The section's name. */
  label: ReactNode;
  /** Where it goes, for a section without a panel. */
  href?: string;
  /** A router link instead of `<a>`. */
  render?: RenderProp;
  /** This is the current page, or its panel holds it: the Ember bar under it. */
  current?: boolean;
  /** SiteNavLinks, in a panel the item opens. */
  children?: ReactNode;
}

/** A section: a link, or (with children) a trigger and its panel of links. */
export function SiteNavItem({
  label,
  href,
  render,
  current,
  children,
}: SiteNavItemProps): ReactElement {
  const mode = use(ModeContext);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  if (mode === "menu") {
    return (
      <li className="qx-site-nav-item">
        {children != null ? (
          <>
            <button
              type="button"
              className="qx-site-nav-trigger"
              aria-expanded={open}
              aria-controls={panelId}
              data-current={current ? "" : undefined}
              onClick={() => setOpen(!open)}
            >
              {label}
              <ChevronDownIcon
                shape="sharp"
                size={16}
                aria-hidden
                className="qx-site-nav-chevron"
              />
            </button>
            <ul id={panelId} className="qx-site-nav-panel" hidden={!open}>
              {children}
            </ul>
          </>
        ) : (
          renderElement("a", render, {
            ...(href ? { href } : {}),
            className: "qx-site-nav-link",
            "aria-current": current ? "page" : undefined,
            "data-current": current ? "" : undefined,
            children: label,
          })
        )}
      </li>
    );
  }
  return (
    <BaseNav.Item className="qx-site-nav-item">
      {children != null ? (
        <>
          <BaseNav.Trigger className="qx-site-nav-trigger" data-current={current ? "" : undefined}>
            {label}
            <BaseNav.Icon className="qx-site-nav-icon">
              <ChevronDownIcon
                shape="sharp"
                size={16}
                aria-hidden
                className="qx-site-nav-chevron"
              />
            </BaseNav.Icon>
          </BaseNav.Trigger>
          <BaseNav.Content className="qx-site-nav-content">
            <ul className="qx-site-nav-panel">{children}</ul>
          </BaseNav.Content>
        </>
      ) : (
        <BaseNav.Link
          {...(href ? { href } : {})}
          {...(render ? { render } : {})}
          active={current}
          className="qx-site-nav-link"
          data-current={current ? "" : undefined}
        >
          {label}
        </BaseNav.Link>
      )}
    </BaseNav.Item>
  );
}

export interface SiteNavLinkProps {
  /** The page's name. */
  label: ReactNode;
  /** One line under it: what's there. */
  description?: ReactNode;
  href?: string;
  render?: RenderProp;
  /** This is the current page. */
  current?: boolean;
}

/** A link in a section's panel: its name and a line about it. Following it closes the panel. */
export function SiteNavLink({
  label,
  description,
  href,
  render,
  current,
}: SiteNavLinkProps): ReactElement {
  const mode = use(ModeContext);
  const content = (
    <>
      <span className="qx-site-nav-link-label">{label}</span>
      {description != null && <span className="qx-site-nav-link-description">{description}</span>}
    </>
  );
  return (
    <li>
      {mode === "menu" ? (
        renderElement("a", render, {
          ...(href ? { href } : {}),
          className: "qx-site-nav-panel-link",
          "aria-current": current ? "page" : undefined,
          children: content,
        })
      ) : (
        <BaseNav.Link
          {...(href ? { href } : {})}
          {...(render ? { render } : {})}
          active={current}
          className="qx-site-nav-panel-link"
        >
          {content}
        </BaseNav.Link>
      )}
    </li>
  );
}
