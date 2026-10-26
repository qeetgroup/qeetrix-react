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
  AvatarItem,
  Breadcrumb,
  BreadcrumbItem,
  Calendar,
  CodeBlock,
  Combobox,
  CopyButton,
  DatePicker,
  DateRangePicker,
  DescriptionItem,
  DescriptionList,
  EmptyState,
  ErrorSummary,
  FileUpload,
  Form,
  NumberField,
  OTPInput,
  PageHeader,
  PageHeaderBack,
  Pagination,
  PasswordInput,
  ProviderButton,
  ProviderButtonGroup,
  RangeCalendar,
  Sidebar,
  SidebarGroup,
  SidebarItem,
  Stat,
  StatGroup,
  Steps,
  ThemeSwitcher,
  Timeline,
  TimelineGroup,
  TimelineItem,
  TreeView,
} from "../src/experimental";
import { QeetrixProvider as StatProvider } from "../src/provider/provider";

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
    // PageHeader's count follows the provider through a client leaf; the back link is a client part.
    const header = html(
      <PageHeader
        back={<PageHeaderBack href="/users">Users</PageHeaderBack>}
        title="Users"
        count={128400}
      />,
    );
    expect(header).toContain('aria-label="Back to Users"');
    expect(header).toContain(">1,28,400</span>");
    expect(
      html(
        <StatProvider locale="en-US">
          <PageHeader title="Users" count={128400} />
        </StatProvider>,
      ),
    ).toContain(">128,400</span>");
  });

  it("Stat follows QeetrixProvider's locale on the server, and renders its loading state", () => {
    const strip = html(
      <StatProvider locale="en-US">
        <StatGroup>
          <Stat label="Collected" value={128400} />
          <Stat label="Pending" value={undefined} loading trend={[1, 3]} />
        </StatGroup>
      </StatProvider>,
    );
    expect(strip).toContain(">128,400</dd>");
    expect(strip).toContain('aria-busy="true"');
    expect(strip).toContain(">Loading</span>");
    expect(strip.match(/data-slot="skeleton"/g)).toHaveLength(2);
    expect(strip).not.toContain("<svg");
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

  it("Calendar and DatePicker render on the server: the month's grid, the field without its dialog", () => {
    const month = html(<Calendar today="2026-10-25" defaultValue="2026-10-20" />);
    expect(month).toContain('role="grid"');
    expect(month).toContain("October 2026");
    expect(month).toContain('data-date="2026-10-31"');
    const field = html(
      <DatePicker aria-label="Joining date" name="joined" defaultValue="2026-10-25" />,
    );
    expect(field).toContain('value="25/10/2026"');
    expect(field).toMatch(/type="hidden" name="joined" value="2026-10-25"/);
    // Named after the field, so two pickers on a form differ, from the server render on.
    expect(field).toContain('aria-label="Choose date for Joining date"');
    expect(field).not.toContain('role="dialog"');
  });

  it("RangeCalendar and DateRangePicker render on the server: the range, the field and its inputs", () => {
    const range = { start: "2026-10-12", end: "2026-10-14" };
    const month = html(<RangeCalendar today="2026-10-25" defaultValue={range} />);
    expect(month).toContain('data-range="start"');
    expect(month).toContain('data-range="middle"');
    expect(month).toContain('data-range="end"');
    const field = html(
      <DateRangePicker aria-label="Period" startName="from" endName="to" defaultValue={range} />,
    );
    expect(field).toContain('value="12/10/2026 – 14/10/2026"');
    expect(field).toMatch(/name="from" value="2026-10-12"/);
    expect(field).toMatch(/name="to" value="2026-10-14"/);
    expect(field).toContain('aria-label="Choose dates for Period"');
    expect(month).toContain('data-slot="range-calendar"');
    expect(field).not.toContain('role="dialog"');
  });

  it("AvatarItem carries no client code, and renders the name and second line", () => {
    expect(source("avatar-item/avatar-item.tsx")).not.toMatch(/^["']use client["']/);
    const out = html(<AvatarItem name="Priya Sharma" description="priya@acme.in" />);
    expect(out).toContain("Priya Sharma");
    expect(out).toContain("priya@acme.in");
    expect(out).toContain('aria-hidden="true"');
  });

  it("FileUpload renders its file input, prompt, hint and rows on the server", () => {
    const out = html(
      <FileUpload
        aria-label="Metadata"
        accept=".xml"
        maxSize={1_000_000}
        items={[{ id: "1", name: "acme.xml", size: 12_000, status: "done" }]}
      />,
    );
    expect(out).toMatch(/<input[^>]*type="file"/);
    expect(out).toContain('accept=".xml"');
    expect(out).toContain("XML, up to 1 MB");
    expect(out).toContain("acme.xml");
    expect(out).toContain("Uploaded");
  });

  it("DescriptionList renders its terms and values on the server", () => {
    const out = html(
      <DescriptionList>
        <DescriptionItem term="Email">priya@acme.in</DescriptionItem>
        <DescriptionItem term="Manager" />
      </DescriptionList>,
    );
    expect(out).toMatch(/^<dl[^>]*data-layout="rows"/);
    expect(out).toMatch(/<dt[^>]*>Email<\/dt><dd[^>]*>priya@acme.in<\/dd>/);
    expect(out).toContain("Not set");
  });

  it("CodeBlock renders highlighted, numbered code on the server", () => {
    const out = html(<CodeBlock code={'{\n  "mfa": true\n}'} language="json" />);
    expect(out).toContain('data-token="keyword"');
    expect(out).toContain('data-token="literal"');
    expect(out).toContain("data-numbers");
    expect(out).toContain('aria-label="JSON"');
  });

  it("Steps renders its ordered list, the current step marked, on the server", () => {
    const out = html(<Steps steps={[{ label: "Type" }, { label: "Configure" }]} current={1} />);
    expect(out).toMatch(/^<ol[^>]*aria-label="Progress"/);
    expect(out).toContain('aria-current="step"');
    expect(out).toContain("Completed");
  });

  it("Timeline carries no client code; Timeline and TreeView render on the server", () => {
    expect(source("timeline/timeline.tsx")).not.toMatch(/^["']use client["']/);
    const events = html(
      <Timeline aria-label="Activity">
        <TimelineGroup label="Today">
          <TimelineItem title="Signed in" time="2 min ago" dateTime="2026-10-25T09:28:00Z" />
        </TimelineGroup>
      </Timeline>,
    );
    expect(events).toMatch(/^<ol[^>]*aria-label="Activity"/);
    expect(events).toContain('<time dateTime="2026-10-25T09:28:00Z"');
    const tree = html(
      <TreeView
        label="Units"
        items={[{ id: "a", label: "Acme", children: [{ id: "b", label: "Engineering" }] }]}
        defaultExpanded={["a"]}
      />,
    );
    expect(tree).toContain('role="tree"');
    expect(tree).toContain('aria-level="2"');
    expect(tree).toContain('aria-expanded="true"');
  });

  it("NumberField renders its formatted value on the server", () => {
    const out = html(<NumberField aria-label="Users" defaultValue={128400} locale="en-IN" />);
    expect(out).toContain('value="1,28,400"');
    expect(out).toContain('aria-roledescription="Number field"');
  });

  it("Form and ErrorSummary render on the server; a form starts with no summary", () => {
    const form = html(<Form aria-label="Invite">fields</Form>);
    expect(form).toMatch(/^<form/);
    expect(form).not.toContain("error-summary");
    const summary = html(<ErrorSummary items={[{ id: "email", message: "Enter a work email" }]} />);
    expect(summary).toContain('href="#email"');
    expect(summary).toContain("Fix these to continue");
    // GOV.UK's shape: the alert inside the focus target, its title a heading.
    expect(summary).toMatch(/^<div[^>]*data-slot="error-summary"/);
    expect(summary).toContain('role="alert"');
    expect(summary).toMatch(/<h2 class="qx-error-summary-title">Fix these to continue<\/h2>/);
  });

  it("OTPInput names its group and points its first slot at it, not at a dropped aria-label", () => {
    const code = html(<OTPInput aria-label="Code" />);
    const group = code.match(/<div[^>]* id="([^"]+)"[^>]*>/);
    expect(group?.[0]).toContain('role="group"');
    expect(group?.[0]).toContain('aria-label="Code"');
    const first = code.match(/<input[^>]*data-slot="otp-input-slot"[^>]*>/)?.[0];
    expect(first).toContain(`aria-labelledby="${group?.[1]}"`);
    expect(first).not.toContain("aria-label=");
  });

  it("Pagination renders its range on the server, formatted for India", () => {
    const out = html(
      <Pagination offset={0} pageSize={25} total={128400} onOffsetChange={() => {}} />,
    );
    expect(out).toContain('aria-label="Pagination"');
    // Each number is bidi-isolated, and the range takes its own text's direction.
    expect(out).toContain('dir="auto"');
    expect(out).toContain("<bdi>1</bdi>–<bdi>25</bdi> of <bdi>1,28,400</bdi>");
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

  it("ThemeSwitcher renders the provider's scheme on the server: a closed menu, or the pressed toggle", () => {
    const menu = html(
      <StatProvider defaultColorScheme="dark">
        <ThemeSwitcher />
      </StatProvider>,
    );
    expect(menu).toMatch(/^<button[^>]*aria-label="Theme"/);
    expect(menu).toContain('aria-haspopup="menu"');
    expect(menu).not.toContain('role="menu"');
    const segmented = html(
      <StatProvider defaultColorScheme="system" messages={{ themeSwitcher: { system: "OS" } }}>
        <ThemeSwitcher variant="segmented" />
      </StatProvider>,
    );
    expect(segmented).toMatch(/^<div[^>]*role="group"/);
    const toggle = (name: string) =>
      segmented.match(new RegExp(`<button[^>]*aria-label="${name}"[^>]*>`))?.[0];
    expect(toggle("OS")).toContain('aria-pressed="true"');
    expect(toggle("Light")).toContain('aria-pressed="false"');
    expect(toggle("Dark")).toContain('aria-pressed="false"');
    // Controlled, it shows its own value whatever the provider holds.
    const controlled = html(<ThemeSwitcher variant="segmented" value="light" />);
    expect(controlled.match(/<button[^>]*aria-label="Light"[^>]*>/)?.[0]).toContain(
      'aria-pressed="true"',
    );
  });

  it("ProviderButtonGroup carries no client code; ProviderButton renders a button or a link", () => {
    expect(source("provider-button/provider-button-group.tsx")).not.toMatch(/^["']use client["']/);
    const row = html(
      <ProviderButtonGroup aria-label="Sign in with another account">
        <ProviderButton aria-label="Sign in with Google" logo={<svg />}>
          Google
        </ProviderButton>
        <ProviderButton
          aria-label="Sign in with Apple"
          logo={<svg />}
          logoInvert="light"
          render={<a href="/oauth/apple" />}
          disabled
        >
          Apple
        </ProviderButton>
      </ProviderButtonGroup>,
    );
    expect(row).toMatch(/^<fieldset aria-label="Sign in with another account"/);
    expect(row).toMatch(/<button aria-label="Sign in with Google" type="button"/);
    expect(row).toContain(
      '<span class="qx-provider-button-logo" data-slot="provider-button-logo" aria-hidden="true">',
    );
    const link = row.match(/<a [^>]*>/)?.[0] ?? "";
    expect(link).toContain('href="/oauth/apple"');
    expect(link).toContain('aria-label="Sign in with Apple"');
    expect(link).toContain('aria-disabled="true"');
    expect(row).not.toMatch(/<a [^>]*type=/);
    expect(row).toContain('data-invert="light"');
  });

  it("switches at the tokens' expanded window class", () => {
    const css = source("app-shell/app-shell.css");
    const tsx = source("app-shell/app-shell.tsx");
    expect(css).toContain(`@media (width < ${BREAKPOINT.expanded}px)`);
    expect(tsx).toContain(`(width >= ${BREAKPOINT.expanded}px)`);
  });
});
