import { ActivityIcon } from "@qeetrix/icons/icons/activity";
import { CircleQuestionMarkIcon } from "@qeetrix/icons/icons/circle-question-mark";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { QeetIdConsole } from "../../../tests/fixtures/qeet-id-console";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { settled } from "../../../tests/support/settled";
import { TopBar } from "../top-bar/top-bar";
import { AppShell } from "./app-shell";

const nav = () => document.querySelector("[data-slot=app-shell-nav]") as HTMLElement;

describe("AppShell", () => {
  it("has the landmarks, and a skip link to the main region", async () => {
    await page.viewport(1440, 900);
    await render(<QeetIdConsole />);
    await expect.element(page.getByRole("banner")).toBeVisible();
    await expect.element(page.getByRole("navigation", { name: "Qeet ID" })).toBeVisible();
    const main = page.getByRole("main").element();
    expect(main.id).toBe("main");
    expect(
      page.getByRole("link", { name: "Skip to main content" }).element().getAttribute("href"),
    ).toBe("#main");
  });

  it("is compact by default, as consoles are", async () => {
    await page.viewport(1440, 900);
    const { container } = await render(<QeetIdConsole />);
    expect(
      (container.querySelector("[data-slot=app-shell]") as HTMLElement).dataset.qxDensity,
    ).toBe("compact");
  });

  it("collapses to a 48px rail from its foot, and reports it", async () => {
    await page.viewport(1440, 900);
    const onSidebarCollapsedChange = vi.fn();
    await render(
      <AppShell
        sidebar={<nav aria-label="Pages">pages</nav>}
        onSidebarCollapsedChange={onSidebarCollapsedChange}
      >
        page
      </AppShell>,
    );
    expect(nav().getBoundingClientRect().width).toBe(256);
    await page.getByRole("button", { name: "Collapse" }).click();
    await settled();
    expect(nav().getBoundingClientRect().width).toBe(48);
    expect(onSidebarCollapsedChange).toHaveBeenLastCalledWith(true);
  });

  it("expands the rail over the page while hovered, and settles back on leave", async () => {
    await page.viewport(1440, 900);
    await render(<QeetIdConsole collapsed />);
    await userEvent.hover(page.getByRole("link", { name: "Organisations" }));
    await expect.poll(() => nav().hasAttribute("data-peek")).toBe(true);
    await settled();
    const panel = nav().querySelector(".qx-app-shell-nav-panel") as HTMLElement;
    expect(panel.getBoundingClientRect().width).toBe(256);
    expect(nav().getBoundingClientRect().width).toBe(48);
    // Somewhere the expanded rail doesn't cover.
    await userEvent.hover(page.getByRole("button", { name: "Invite users" }));
    await expect.poll(() => nav().hasAttribute("data-peek")).toBe(false);
  });

  it("opens an end-edge panel from the bar's tools, one at a time", async () => {
    await page.viewport(1440, 900);
    const onActiveDrawerChange = vi.fn();
    await render(
      <AppShell
        topBar={<TopBar product="Qeet ID" />}
        drawers={[
          { id: "help", label: "Help", icon: CircleQuestionMarkIcon, content: "Help text" },
          { id: "activity", label: "Activity", icon: ActivityIcon, content: "Recent changes" },
        ]}
        onActiveDrawerChange={onActiveDrawerChange}
      >
        page
      </AppShell>,
    );
    await page.getByRole("button", { name: "Help" }).click();
    expect(page.getByRole("complementary", { name: "Help" }).element().textContent).toContain(
      "Help text",
    );
    await expect
      .element(page.getByRole("button", { name: "Help" }))
      .toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Activity" }).click();
    await expect.element(page.getByRole("complementary", { name: "Activity" })).toBeVisible();
    expect(page.getByRole("complementary").elements()).toHaveLength(1);
    await page.getByRole("button", { name: "Close panel" }).click();
    expect(onActiveDrawerChange).toHaveBeenLastCalledWith(null);
  });

  it("opens the navigation from the bar's menu button on narrow screens", async () => {
    await page.viewport(600, 800);
    await render(<QeetIdConsole />);
    expect(getComputedStyle(nav()).display).toBe("none");
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect.element(page.getByRole("dialog", { name: "Navigation" })).toBeVisible();
    await page.getByRole("link", { name: "Organisations" }).click();
    await expect.element(page.getByRole("dialog", { name: "Navigation" })).not.toBeInTheDocument();
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(1440, 900);
    const { container } = await render(<QeetIdConsole density="inherit" />);
    await expectAccessible(container);
    await screenshotEveryMode("AppShell", null);
  });
});
