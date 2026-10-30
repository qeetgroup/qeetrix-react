import { CreditCardIcon } from "@qeetrix/icons/icons/credit-card";
import { FileTextIcon } from "@qeetrix/icons/icons/file-text";
import { LayoutGridIcon } from "@qeetrix/icons/icons/layout-grid";
import { SettingsIcon } from "@qeetrix/icons/icons/settings";
import { WalletIcon } from "@qeetrix/icons/icons/wallet";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { baseline } from "../../../tests/support/baseline";
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

  it("fills the current item's icon by default, and keeps the outline when asked (QTRX-168)", async () => {
    await render(
      <Sidebar label="Qeet Pay">
        <SidebarGroup>
          <SidebarItem label="Payments" href="#payments" icon={CreditCardIcon} current />
          <SidebarItem
            label="Payouts"
            href="#payouts"
            icon={WalletIcon}
            current
            filledWhenCurrent={false}
          />
        </SidebarGroup>
      </Sidebar>,
    );
    const shown = (name: string) =>
      [...page.getByRole("link", { name }).element().querySelectorAll("svg")]
        .filter((svg) => getComputedStyle(svg).display !== "none")
        .map((svg) => svg.getAttribute("class"));
    expect(shown("Payments")).toEqual(["qx-sidebar-icon qx-sidebar-icon-filled"]);
    expect(shown("Payouts")).toEqual(["qx-sidebar-icon qx-sidebar-icon-outline"]);
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

  it("labels its groups in tracked small capitals between hairlines", async () => {
    await render(<PayNav />);
    const label = page.getByText("Money").element();
    expect(getComputedStyle(label).textTransform).toBe("uppercase");
    expect(getComputedStyle(label).letterSpacing).toBe("0.66px");
    expect(getComputedStyle(label).fontSize).toBe("11px");
    const group = label.closest("[data-slot=sidebar-group]") as HTMLElement;
    expect(getComputedStyle(group).borderTopWidth).toBe("1px");
  });

  it("drops the tracking for Indic text, whose conjuncts it would loosen", async () => {
    await render(
      <div lang="hi">
        <Sidebar label="Qeet Pay">
          <SidebarGroup label="भुगतान">
            <SidebarItem label="भुगतान सूची" href="#payments" />
          </SidebarGroup>
        </Sidebar>
      </div>,
    );
    expect(getComputedStyle(page.getByText("भुगतान", { exact: true }).element()).letterSpacing).toBe(
      "normal",
    );
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

  it("sets counts and badges on the label's baseline, at every density", async () => {
    const { container } = await render(
      <Sidebar label="Qeet ID">
        <SidebarGroup label="Directory">
          <SidebarItem label="Users" href="#users" icon={LayoutGridIcon} badge="1,284" current />
          <SidebarItem
            label="Payments"
            href="#payments"
            icon={CreditCardIcon}
            badge={<Badge tone="danger">3</Badge>}
          />
          <SidebarItem label="Reports" icon={FileTextIcon} badge="12">
            <SidebarItem label="Daily" href="#daily" badge="4" />
          </SidebarItem>
        </SidebarGroup>
      </Sidebar>,
    );
    const rows = [...container.querySelectorAll(".qx-sidebar-item")];
    for (const density of ["compact", "default", "comfortable"]) {
      document.documentElement.dataset.qxDensity = density;
      for (const row of rows) {
        const label = baseline(row.querySelector(".qx-sidebar-label"));
        const count = baseline(row.querySelector("[data-slot=sidebar-item-badge]"));
        expect(Math.abs(count - label), `${row.textContent}, ${density}`).toBeLessThanOrEqual(0.5);
        // The label stays centred on the row.
        const box = row.getBoundingClientRect();
        const text = (
          row.querySelector(".qx-sidebar-label") as HTMLElement
        ).getBoundingClientRect();
        expect(
          Math.abs(text.top + text.height / 2 - (box.top + box.height / 2)),
        ).toBeLessThanOrEqual(0.5);
      }
    }
    delete document.documentElement.dataset.qxDensity;
  });

  it("passes its own props to the link: id, aria-*, data-*, target and ref", async () => {
    const ref = vi.fn();
    await render(
      <Sidebar label="Qeet ID">
        <SidebarGroup>
          <SidebarItem
            label="API reference"
            href="https://docs.qeet.in"
            id="docs-link"
            aria-describedby="docs-note"
            data-track="docs"
            target="_blank"
            rel="noreferrer"
            ref={ref}
          />
        </SidebarGroup>
      </Sidebar>,
    );
    const link = page.getByRole("link", { name: "API reference" });
    await expect.element(link).toHaveAttribute("id", "docs-link");
    await expect.element(link).toHaveAttribute("aria-describedby", "docs-note");
    await expect.element(link).toHaveAttribute("data-track", "docs");
    await expect.element(link).toHaveAttribute("target", "_blank");
    await expect.element(link).toHaveAttribute("rel", "noreferrer");
    expect(ref).toHaveBeenCalledWith(link.element());
  });

  it("shows a disabled item greyed, out of the Tab order and not followed", async () => {
    const onClick = vi.fn();
    await render(
      <Sidebar label="Qeet ID">
        <SidebarGroup>
          <SidebarItem label="Users" href="#users" icon={LayoutGridIcon} />
          <SidebarItem
            label="Audit logs"
            href="#audit"
            icon={FileTextIcon}
            disabled
            onClick={onClick}
          />
          <SidebarItem label="Reports" icon={FileTextIcon} disabled>
            <SidebarItem label="Daily" href="#daily" />
          </SidebarItem>
          <SidebarItem label="Settings" href="#settings" icon={SettingsIcon} />
        </SidebarGroup>
      </Sidebar>,
    );
    const audit = page.getByRole("link", { name: "Audit logs" });
    await expect.element(audit).toHaveAttribute("aria-disabled", "true");
    expect(audit.element().hasAttribute("href")).toBe(false);
    expect(getComputedStyle(audit.element()).color).toBe(tokenColor("--qx-color-text-disabled"));
    await expect.element(page.getByRole("button", { name: "Reports" })).toBeDisabled();
    // Tab goes from Users straight to Settings, past both.
    await tab();
    await expect.element(page.getByRole("link", { name: "Users" })).toHaveFocus();
    await tab();
    await expect.element(page.getByRole("link", { name: "Settings" })).toHaveFocus();
    await audit.click({ force: true });
    expect(onClick).not.toHaveBeenCalled();
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

function DocsNav({ current = "toggle" }: { current?: string }) {
  return (
    <div style={{ inlineSize: 260, blockSize: 560 }}>
      <Sidebar label="Docs" filter>
        <SidebarGroup>
          <SidebarItem label="Get started" href="#start" icon={FileTextIcon} />
          <SidebarItem
            label="Components"
            href="#components"
            icon={LayoutGridIcon}
            current={current === "components"}
          >
            <SidebarItem label="Actions" href="#actions" current={current === "actions"}>
              <SidebarItem label="Button" href="#button" current={current === "button"} />
              <SidebarItem label="Toggle" href="#toggle" current={current === "toggle"} />
            </SidebarItem>
            <SidebarItem label="Layout">
              <SidebarItem label="Stack" href="#stack" />
            </SidebarItem>
          </SidebarItem>
        </SidebarGroup>
      </Sidebar>
    </div>
  );
}

describe("Sidebar levels", () => {
  it("opens every category around the current page, two levels deep, and marks the page", async () => {
    await render(<DocsNav />);
    const toggle = page.getByRole("link", { name: "Toggle" });
    await expect.element(toggle).toBeVisible();
    await expect.element(toggle).toHaveAttribute("aria-current", "page");
    await expect
      .element(page.getByRole("button", { name: "Components" }))
      .toHaveAttribute("aria-expanded", "true");
    await expect
      .element(page.getByRole("button", { name: "Actions" }))
      .toHaveAttribute("aria-expanded", "true");
    expect(page.getByRole("link", { name: "Stack" }).query()).toBeNull();
  });

  it("steps each level in from its parent's label", async () => {
    await render(<DocsNav />);
    const left = (name: string) =>
      (
        page.getByRole("link", { name }).element().querySelector(".qx-sidebar-label") as HTMLElement
      ).getBoundingClientRect().left;
    expect(left("Actions")).toBe(left("Components"));
    expect(left("Toggle") - left("Actions")).toBe(16);
  });

  it("filters the whole tree, keeping a match's categories open around it", async () => {
    await render(<DocsNav current="none" />);
    await userEvent.type(page.getByRole("searchbox", { name: "Filter navigation" }), "toggle");
    await expect.element(page.getByRole("link", { name: "Toggle" })).toBeVisible();
    await expect.element(page.getByRole("link", { name: "Components" })).toBeVisible();
    await expect.element(page.getByRole("link", { name: "Actions" })).toBeVisible();
    expect(page.getByRole("link", { name: "Button" }).query()).toBeNull();
    expect(page.getByRole("link", { name: "Get started" }).query()).toBeNull();
  });

  it("makes a category a page: its row is the link, and a button at its end folds it", async () => {
    await render(<DocsNav current="actions" />);
    const actions = page.getByRole("link", { name: "Actions" });
    await expect.element(actions).toHaveAttribute("href", "#actions");
    await expect.element(actions).toHaveAttribute("aria-current", "page");
    const fold = page.getByRole("button", { name: "Actions" });
    await expect.element(fold).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(fold);
    await expect.element(fold).toHaveAttribute("aria-expanded", "false");
    expect(page.getByRole("link", { name: "Toggle" }).query()).toBeNull();
    expect(window.location.hash).toBe("");
    const row = actions.element().getBoundingClientRect();
    const button = fold.element().getBoundingClientRect();
    expect(button.right).toBeLessThanOrEqual(row.right);
    expect(button.left).toBeGreaterThan(row.left + row.width / 2);
  });

  it("is accessible and looks right in every mode", async () => {
    await render(<DocsNav />);
    await expectAccessible(document.body);
    await screenshotEveryMode("Sidebar · levels", "[data-slot=sidebar]");
  });
});
