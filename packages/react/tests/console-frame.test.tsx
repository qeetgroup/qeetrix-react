/**
 * The exit for increment C1 (07-components.md): consoles from the same parts. Qeet ID's Users
 * page shows the dense "heavy data" state consoles live in, plus the rail (hovered), an open panel,
 * and the empty, loading and error states. Qeet Pay's frame proves the parts carry a second
 * product, since a pattern needs two.
 */
import { CreditCardIcon } from "@qeetrix/icons/icons/credit-card";
import { FileTextIcon } from "@qeetrix/icons/icons/file-text";
import { WalletIcon } from "@qeetrix/icons/icons/wallet";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  AppShell,
  Breadcrumb,
  BreadcrumbItem,
  PageContent,
  PageHeader,
  Sidebar,
  SidebarGroup,
  SidebarItem,
  TopBar,
} from "../src/experimental";
import { QeetrixProvider, Text } from "../src/index";
import { QeetIdConsole } from "./fixtures/qeet-id-console";
import { expectAccessible } from "./support/axe";
import { canEmulateMedia, emulateMedia } from "./support/media";
import { screenshotSchemes } from "./support/screenshots";

function QeetPayConsole() {
  return (
    <AppShell
      topBar={<TopBar product="Qeet Pay" href="#home" />}
      sidebar={
        <Sidebar label="Qeet Pay" title="Payments">
          <SidebarGroup label="Money">
            <SidebarItem label="Payments" href="#payments" icon={CreditCardIcon} />
            <SidebarItem label="Payouts" href="#payouts" icon={WalletIcon} />
            <SidebarItem label="Invoices" icon={FileTextIcon}>
              <SidebarItem label="Sent" href="#sent" current />
              <SidebarItem label="E-invoices (IRN)" href="#irn" />
            </SidebarItem>
          </SidebarGroup>
        </Sidebar>
      }
    >
      <PageHeader
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbItem href="#invoices">Invoices</BreadcrumbItem>
            <BreadcrumbItem current>Sent</BreadcrumbItem>
          </Breadcrumb>
        }
        title="Sent invoices"
        count={312}
      />
      <PageContent>
        <Text tone="subtle">Invoices sent this month.</Text>
      </PageContent>
    </AppShell>
  );
}

const html = document.documentElement;
let reset: (() => Promise<void>) | undefined;
afterEach(async () => {
  await reset?.();
  reset = undefined;
  html.removeAttribute("dir");
});

describe("C1 exit: consoles from the same parts", () => {
  it("Qeet ID: the Users page with its data", async () => {
    await page.viewport(1440, 900);
    const { container } = await render(<QeetIdConsole />);
    await expectAccessible(container);
    await screenshotSchemes("Console · Qeet ID · users", null);
  });

  it("Qeet ID: the rail, hovered open over the page", async () => {
    await page.viewport(1440, 900);
    await render(<QeetIdConsole collapsed />);
    await screenshotSchemes("Console · Qeet ID · rail", null);
    // Keyboard focus expands the rail as hover does, and holds still for the screenshot.
    page.getByRole("link", { name: "Organisations" }).element().focus();
    await expect.poll(() => document.querySelector("[data-peek]") !== null).toBe(true);
    await screenshotSchemes("Console · Qeet ID · rail expanded", null);
  });

  it("Qeet ID: the help panel open beside the page", async () => {
    await page.viewport(1440, 900);
    await render(<QeetIdConsole drawer="help" />);
    await screenshotSchemes("Console · Qeet ID · help panel", null);
  });

  it("Qeet ID: empty, loading and error", async () => {
    await page.viewport(1440, 720);
    const screen = await render(<QeetIdConsole state="empty" />);
    await screenshotSchemes("Console · Qeet ID · empty", null);
    await screen.rerender(<QeetIdConsole state="error" />);
    await screenshotSchemes("Console · Qeet ID · error", null);
  });

  it("Qeet ID: narrow, with the navigation open", async () => {
    await page.viewport(420, 800);
    await render(<QeetIdConsole />);
    await page.getByRole("button", { name: "Open navigation" }).click();
    await screenshotSchemes("Console · Qeet ID · narrow", null);
  });

  it("Qeet ID: right-to-left and forced colours", async () => {
    await page.viewport(1440, 900);
    html.dir = "rtl";
    await render(
      <QeetrixProvider direction="rtl">
        <QeetIdConsole />
      </QeetrixProvider>,
    );
    await screenshotSchemes("Console · Qeet ID · right-to-left", null);
    if (canEmulateMedia) {
      reset = await emulateMedia({ "forced-colors": "active" });
      await screenshotSchemes("Console · Qeet ID · forced colours", null);
    }
  });

  it("Qeet Pay: another product in the same frame", async () => {
    await page.viewport(1280, 600);
    const { container } = await render(<QeetPayConsole />);
    await expectAccessible(container);
    await screenshotSchemes("Console · Qeet Pay", null);
  });
});
