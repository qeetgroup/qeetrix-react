/**
 * The experimental channel on the server (07-components.md, C1): Breadcrumb, EmptyState, PageHeader
 * and Stat are server-safe; AppShell renders its wide layout first, with no drawer markup; the shell's breakpoint
 * is the tokens' `expanded` window class.
 */
import { readFileSync } from "node:fs";
import { BREAKPOINT } from "@qeetrix/tokens";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Alert,
  AppShell,
  Breadcrumb,
  BreadcrumbItem,
  Combobox,
  CopyButton,
  EmptyState,
  NumberField,
  OTPInput,
  PasswordInput,
  Sidebar,
  SidebarGroup,
  SidebarItem,
  Stat,
  StatGroup,
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

  it("PageHeader and Stat carry no client code; numbers are formatted for India by default", () => {
    expect(source("page-header/page-header.tsx")).not.toMatch(/^["']use client["']/);
    expect(source("stat/stat.tsx")).not.toMatch(/^["']use client["']/);
    const strip = html(
      <StatGroup>
        <Stat label="Collected" value={128400} trend={[1, 3, 2, 5]} />
        <Stat label="Ratio" value="72%" />
      </StatGroup>,
    );
    expect(strip).toMatch(/^<dl class="qx-stat-group"/);
    expect(strip).toContain(">1,28,400</dd>");
    expect(strip).toContain(">72%</dd>");
    expect(strip.match(/<svg/g)).toHaveLength(1);
  });

  it("C2's parts render on the server: hidden secrets, six named slots, a quiet alert", () => {
    const secret = html(<PasswordInput aria-label="Password" defaultValue="x" />);
    expect(secret).toContain('type="password"');
    expect(secret).toMatch(/autocomplete="current-password"/i);
    const code = html(<OTPInput aria-label="Code" />);
    expect(code.match(/<input/g)?.length).toBeGreaterThanOrEqual(6);
    expect(code).toContain('aria-label="Character 6 of 6"');
    const alert = html(<Alert tone="warning" title="Heads up" />);
    expect(alert).not.toContain("role=");
    expect(alert).toContain("Warning: ");
    expect(html(<CopyButton value="x" label="Copy ID" />)).toContain('aria-label="Copy ID"');
  });

  it("Combobox renders its field on the server, without its list", () => {
    const out = html(<Combobox items={[{ value: "a", label: "Apple" }]} aria-label="Fruit" />);
    expect(out).toContain('role="combobox"');
    expect(out).toContain('aria-label="Fruit"');
    expect(out).not.toContain('role="listbox"');
  });

  it("NumberField renders its formatted value on the server", () => {
    const out = html(<NumberField aria-label="Users" defaultValue={128400} locale="en-IN" />);
    expect(out).toContain('value="1,28,400"');
    expect(out).toContain('aria-roledescription="Number field"');
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
