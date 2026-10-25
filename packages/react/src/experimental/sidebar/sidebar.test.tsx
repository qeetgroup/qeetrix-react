import { CreditCardIcon } from "@qeetrix/icons/icons/credit-card";
import { FileTextIcon } from "@qeetrix/icons/icons/file-text";
import { LayoutGridIcon } from "@qeetrix/icons/icons/layout-grid";
import { SettingsIcon } from "@qeetrix/icons/icons/settings";
import { WalletIcon } from "@qeetrix/icons/icons/wallet";
import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { tab } from "../../../tests/support/keyboard";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { Badge } from "../../badge/badge";
import { AppShell } from "../app-shell/app-shell";
import { Sidebar, SidebarGroup, SidebarItem } from "./sidebar";

function PayNav({ reportsCurrent = false }: { reportsCurrent?: boolean }) {
  return (
    <Sidebar label="Qeet Pay" style={{ inlineSize: 256, blockSize: 420 }}>
      <SidebarGroup>
        <SidebarItem label="Overview" href="#overview" icon={LayoutGridIcon} filledWhenCurrent />
      </SidebarGroup>
      <SidebarGroup label="Money">
        <SidebarItem
          label="Payments"
          href="#payments"
          icon={CreditCardIcon}
          current={!reportsCurrent}
          badge={<Badge tone="danger">3</Badge>}
        />
        <SidebarItem label="Payouts" href="#payouts" icon={WalletIcon} />
        <SidebarItem label="Reports" icon={FileTextIcon}>
          <SidebarItem label="Daily" href="#daily" current={reportsCurrent} />
          <SidebarItem label="GST returns" href="#gst" />
        </SidebarItem>
      </SidebarGroup>
      <SidebarGroup label="Account">
        <SidebarItem label="Settings" href="#settings" icon={SettingsIcon} />
      </SidebarGroup>
    </Sidebar>
  );
}

describe("Sidebar", () => {
  it("is a named navigation; the current page has aria-current and the 3px Ember bar", async () => {
    await render(<PayNav />);
    await expect.element(page.getByRole("navigation", { name: "Qeet Pay" })).toBeVisible();
    const payments = page.getByRole("link", { name: /Payments/ });
    await expect.element(payments).toHaveAttribute("aria-current", "page");
    const bar = getComputedStyle(payments.element(), "::before");
    expect(bar.width).toBe("3px");
    expect(bar.backgroundColor).toBe(tokenColor("--qx-color-border-brand"));
    await expect.element(page.getByRole("list", { name: "Money" })).toBeVisible();
  });

  it("opens and closes a category; it starts open when it holds the current page", async () => {
    await render(<PayNav reportsCurrent />);
    const reports = page.getByRole("button", { name: "Reports" });
    await expect.element(reports).toHaveAttribute("aria-expanded", "true");
    await expect
      .element(page.getByRole("link", { name: "Daily" }))
      .toHaveAttribute("aria-current", "page");
    await reports.click();
    await expect.element(reports).toHaveAttribute("aria-expanded", "false");
    // Closed, it carries the current mark for its current child.
    await expect.element(reports).toHaveAttribute("data-current", "");
  });

  it("puts every item in the Tab order; Space toggles a category", async () => {
    await render(<PayNav />);
    for (let i = 0; i < 4; i++) await tab();
    const reports = page.getByRole("button", { name: "Reports" });
    await expect.element(reports).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect.element(reports).toHaveAttribute("aria-expanded", "true");
  });

  it("becomes a rail in a collapsed AppShell: names stay, labels move to tooltips", async () => {
    await page.viewport(1200, 600);
    await render(
      <AppShell defaultSidebarCollapsed sidebar={<PayNav />}>
        <p>Page</p>
      </AppShell>,
    );
    const payouts = page.getByRole("link", { name: "Payouts" });
    expect(payouts.element().getBoundingClientRect().width).toBe(32);
    await userEvent.hover(payouts);
    await expect
      .poll(() => document.querySelector("[data-slot=tooltip-popup]")?.textContent)
      .toBe("Payouts");
    await page.getByRole("button", { name: "Reports" }).click();
    await expect.element(page.getByRole("link", { name: "GST returns" })).toBeVisible();
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(320, 460);
    await render(<PayNav reportsCurrent />);
    await expectAccessible(document.body);
    await screenshotEveryMode("Sidebar", "[data-slot=sidebar]");
  });
});
