"use client";

import { MenuIcon } from "@qeetrix/icons/icons/menu";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { IconButton } from "../../button/button";
import { cx } from "../../internal/cx";
import { type RenderProp, renderElement } from "../../internal/render";
import { useShellState } from "../app-shell/app-shell";

export interface TopBarProps extends Omit<ComponentProps<"header">, "children"> {
  /** The suite launcher: a Menu of Qeet products. */
  launcher?: ReactNode;
  /** The product's mark, e.g. `<QeetLogo height={20} />`. */
  logo?: ReactNode;
  /** The product's name, beside the mark: "Qeet ID". */
  product: string;
  /** The identity's link home. */
  href?: string;
  /** A router link for the identity instead of `<a>`. */
  render?: RenderProp;
  /** The context picker: organisation, project or environment. */
  context?: ReactNode;
  /** The global search control, centred and up to 560px wide. Hidden below 840px. */
  search?: ReactNode;
  /** Utility IconButtons in the neutral tone: assistant, help, notifications, settings. */
  actions?: ReactNode;
  /** The account menu: an Avatar trigger. */
  account?: ReactNode;
}

/**
 * The global bar of a Qeet console (07-components.md, C1): identity, context, search, utilities
 * and account across the full width. It's always the dark scheme, like the consoles enterprises run
 * on, so it reads the same over light and dark pages.
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
    >
      <div className="qx-top-bar-start">
        {shell.narrow && (
          <IconButton
            icon={MenuIcon}
            aria-label={shell.strings.open}
            tone="neutral"
            tooltip={false}
            onClick={shell.openNavigation}
          />
        )}
        {launcher}
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
        {context != null && (
          <>
            <span className="qx-top-bar-divider" aria-hidden />
            <div className="qx-top-bar-context" data-slot="top-bar-context">
              {context}
            </div>
          </>
        )}
      </div>
      {search != null && (
        <div className="qx-top-bar-search" data-slot="top-bar-search">
          {search}
        </div>
      )}
      <div className="qx-top-bar-end">
        {shell.narrow &&
          shell.drawers.map((drawer) => (
            <IconButton
              key={drawer.id}
              icon={drawer.icon}
              aria-label={drawer.label}
              aria-pressed={shell.activeDrawer === drawer.id}
              tone="neutral"
              onClick={() => shell.toggleDrawer(drawer.id)}
            />
          ))}
        {actions}
        {account}
      </div>
    </header>
  );
}
