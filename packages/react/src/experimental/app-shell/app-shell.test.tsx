import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { settled } from "../../../tests/support/settled";
import { Sidebar, SidebarGroup, SidebarItem } from "../sidebar/sidebar";
import { AppShell } from "./app-shell";

const html = document.documentElement;

function Shell(props: Partial<React.ComponentProps<typeof AppShell>>) {
  return (
    <AppShell
      sidebar={
        <Sidebar label="Qeet Pay">
          <SidebarGroup>
            <SidebarItem label="Payments" href="#payments" current />
            <SidebarItem label="Payouts" href="#payouts" />
          </SidebarGroup>
        </Sidebar>
      }
      header={<span>Payments</span>}
      actions={<span>Production</span>}
      {...props}
    >
      <h1>Payments</h1>
    </AppShell>
  );
}

describe("AppShell", () => {
  it("has the landmarks, in order, and a skip link to the main region", async () => {
    await page.viewport(1200, 700);
    await render(<Shell />);
    await expect.element(page.getByRole("navigation", { name: "Qeet Pay" })).toBeVisible();
    await expect.element(page.getByRole("banner")).toBeVisible();
    const main = page.getByRole("main").element();
    expect(main.id).toBe("main");
    expect(main.getAttribute("tabindex")).toBe("-1");
    expect(
      page.getByRole("link", { name: "Skip to main content" }).element().getAttribute("href"),
    ).toBe("#main");
  });

  it("collapses to a 48px rail on wide screens, and reports it", async () => {
    await page.viewport(1200, 700);
    const onSidebarCollapsedChange = vi.fn();
    const { container } = await render(
      <Shell onSidebarCollapsedChange={onSidebarCollapsedChange} />,
    );
    const column = container.querySelector("[data-slot=app-shell-sidebar]") as HTMLElement;
    expect(column.getBoundingClientRect().width).toBe(256);
    const toggle = page.getByRole("button", { name: "Collapse navigation" });
    await expect.element(toggle).toHaveAttribute("aria-expanded", "true");
    await toggle.click();
    await settled();
    expect(column.getBoundingClientRect().width).toBe(48);
    expect(onSidebarCollapsedChange).toHaveBeenLastCalledWith(true);
    await expect
      .element(page.getByRole("button", { name: "Expand navigation" }))
      .toHaveAttribute("aria-expanded", "false");
  });

  it("opens the sidebar as a drawer on narrow screens, and closes it when a link is followed", async () => {
    await page.viewport(600, 700);
    const { container } = await render(<Shell />);
    expect(
      getComputedStyle(container.querySelector("[data-slot=app-shell-sidebar]") as HTMLElement)
        .display,
    ).toBe("none");
    await page.getByRole("button", { name: "Open navigation" }).click();
    const drawer = page.getByRole("dialog", { name: "Navigation" });
    await expect.element(drawer).toBeVisible();
    await page.getByRole("link", { name: "Payouts" }).click();
    await expect.element(drawer).not.toBeInTheDocument();
  });

  it("follows the density: a 48, 56 or 60px header", async () => {
    await page.viewport(1200, 700);
    const { container } = await render(<Shell />);
    const header = container.querySelector("[data-slot=app-shell-header]") as HTMLElement;
    const heights: Record<string, number> = {};
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      heights[density] = header.getBoundingClientRect().height;
    }
    delete html.dataset.qxDensity;
    expect(heights).toEqual({ compact: 48, default: 56, comfortable: 60 });
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(900, 420);
    const { container } = await render(<Shell />);
    await expectAccessible(container);
    await screenshotEveryMode("AppShell", null);
  });
});
