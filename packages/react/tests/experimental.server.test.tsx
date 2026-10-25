/**
 * The experimental channel on the server (07-components.md, C1): Breadcrumb and EmptyState are
 * server-safe; AppShell renders its wide layout first, with no drawer markup; the shell's breakpoint
 * is the tokens' `expanded` window class.
 */
import { readFileSync } from "node:fs";
import { BREAKPOINT } from "@qeetrix/tokens";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  AppShell,
  Breadcrumb,
  BreadcrumbItem,
  EmptyState,
  Sidebar,
  SidebarGroup,
  SidebarItem,
} from "../src/experimental";

const html = (node: React.ReactElement) => renderToString(node);
const source = (path: string) =>
  readFileSync(new URL(`../src/experimental/${path}`, import.meta.url), "utf8");

describe("experimental components on the server", () => {
  it("Breadcrumb and EmptyState carry no client code", () => {
    expect(source("breadcrumb/breadcrumb.tsx")).not.toMatch(/^["']use client["']/);
    expect(source("empty-state/empty-state.tsx")).not.toMatch(/^["']use client["']/);
    const trail = html(
      <Breadcrumb>
        <BreadcrumbItem href="/users">Users</BreadcrumbItem>
        <BreadcrumbItem current>Priya</BreadcrumbItem>
      </Breadcrumb>,
    );
    expect(trail).toMatch(/^<nav aria-label="Breadcrumb"/);
    expect(trail).toContain('aria-current="page"');
    expect(html(<EmptyState title="No users yet" level={2} />)).toContain("<h2");
  });

  it("AppShell renders the wide layout, its landmarks and no drawer", () => {
    const out = html(
      <AppShell
        sidebar={
          <Sidebar label="Qeet ID">
            <SidebarGroup>
              <SidebarItem label="Users" href="/users" current />
            </SidebarGroup>
          </Sidebar>
        }
      >
        page
      </AppShell>,
    );
    expect(out).toContain('href="#main"');
    expect(out).toContain('<nav aria-label="Qeet ID"');
    expect(out).toContain('<main id="main" tabindex="-1"');
    expect(out).toContain('aria-expanded="true"');
    expect(out).toContain(">Collapse</span>");
    expect(out).not.toContain("app-shell-drawer");
  });

  it("switches at the tokens' expanded window class", () => {
    const css = source("app-shell/app-shell.css");
    const tsx = source("app-shell/app-shell.tsx");
    expect(css).toContain(`@media (width < ${BREAKPOINT.expanded}px)`);
    expect(tsx).toContain(`(width >= ${BREAKPOINT.expanded}px)`);
  });
});
