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
    <Sidebar label="Qeet Pay" title="Payments" filter>
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
    for (let i = 0; i < 5; i++) await tab();
    const reports = page.getByRole("button", { name: "Reports" });
    await expect.element(reports).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect.element(reports).toHaveAttribute("aria-expanded", "true");
  });

  it("filters its items as you type; categories with matches open", async () => {
    await render(<PayNav />);
    await userEvent.type(page.getByRole("searchbox", { name: "Filter navigation" }), "gst");
    await expect.element(page.getByRole("link", { name: "GST returns" })).toBeVisible();
    expect(page.getByRole("link", { name: /Payouts/ }).elements()).toHaveLength(0);
    await userEvent.clear(page.getByRole("searchbox", { name: "Filter navigation" }));
    await userEvent.type(page.getByRole("searchbox", { name: "Filter navigation" }), "zzz");
    await expect.element(page.getByText("No pages match")).toBeVisible();
  });

  it("labels its groups in small capitals between hairlines", async () => {
    await render(<PayNav />);
    const label = page.getByText("Money").element();
    expect(getComputedStyle(label).textTransform).toBe("uppercase");
    const group = label.closest("[data-slot=sidebar-group]") as HTMLElement;
    expect(getComputedStyle(group).borderTopWidth).toBe("1px");
  });

  it("becomes a 48px rail in a collapsed AppShell: icons stay put and keep their names", async () => {
    await page.viewport(1200, 600);
    const iconX = () =>
      (
        page
          .getByRole("link", { name: "Payouts" })
          .element()
          .querySelector(".qx-sidebar-icon") as Element
      ).getBoundingClientRect().left;
    const expanded = await render(
      <AppShell sidebar={<PayNav />}>
        <p>Page</p>
      </AppShell>,
    );
    const open = iconX();
    await expanded.unmount();
    await render(
      <AppShell defaultSidebarCollapsed sidebar={<PayNav />}>
        <p>Page</p>
      </AppShell>,
    );
    const payouts = page.getByRole("link", { name: "Payouts" });
    // The 48px rail, less its 1px rule.
    expect(payouts.element().getBoundingClientRect().width).toBe(47);
    expect(iconX()).toBe(open);
    await page.getByRole("button", { name: "Reports" }).click();
    await expect.element(page.getByRole("link", { name: "GST returns" })).toBeVisible();
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(320, 460);
    await render(
      <div style={{ inlineSize: 256, blockSize: 460 }}>
        <PayNav reportsCurrent />
      </div>,
    );
    await expectAccessible(document.body);
    await screenshotEveryMode("Sidebar", "[data-slot=sidebar]");
  });
});
