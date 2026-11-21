import { ActivityIcon } from "@qeetrix/icons/icons/activity";
import { CircleQuestionMarkIcon } from "@qeetrix/icons/icons/circle-question-mark";
import { PlusIcon } from "@qeetrix/icons/icons/plus";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { QeetIdConsole } from "../../../tests/fixtures/qeet-id-console";
import { expectAccessible } from "../../../tests/support/axe";
import { tab } from "../../../tests/support/keyboard";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { settled } from "../../../tests/support/settled";
import { IconButton } from "../../button/button";
import { PageHeader } from "../page-header/page-header";
import { TopBar, TopBarSearch } from "../top-bar/top-bar";
import { AppShell, type AppShellDrawer } from "./app-shell";

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

  it("sets a panel's width, and resizes it from its start edge by keyboard and pointer", async () => {
    await page.viewport(1440, 900);
    const onWidthChange = vi.fn();
    await render(
      <AppShell
        topBar={<TopBar product="Qeet ID" />}
        defaultActiveDrawer="assistant"
        drawers={[
          {
            id: "assistant",
            label: "Qeet AI",
            icon: ActivityIcon,
            content: "Ask anything",
            width: 400,
            minWidth: 340,
            maxWidth: 720,
            resizable: true,
            onWidthChange,
          },
        ]}
      >
        page
      </AppShell>,
    );
    const panel = page.getByRole("complementary", { name: "Qeet AI" }).element();
    expect(panel.getBoundingClientRect().width).toBe(400);
    const handle = page.getByRole("separator", { name: "Resize Qeet AI" });
    await expect.element(handle).toHaveAttribute("aria-valuenow", "400");
    await handle.click();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onWidthChange).toHaveBeenLastCalledWith(416);
    expect(panel.getBoundingClientRect().width).toBe(416);
    await userEvent.keyboard("{End}");
    expect(onWidthChange).toHaveBeenLastCalledWith(720);
    await userEvent.keyboard("{Home}");
    expect(onWidthChange).toHaveBeenLastCalledWith(340);
    await expect.element(handle).toHaveAttribute("aria-valuemin", "340");
  });

  it("leaves no band without a bar: the navigation and panel fill the window, at every density", async () => {
    const drawers = [
      { id: "help", label: "Help", icon: CircleQuestionMarkIcon, content: "Help text" },
    ];
    for (const density of ["compact", "default", "comfortable"] as const) {
      await page.viewport(1440, 900);
      const { unmount } = await render(
        <AppShell
          density={density}
          sidebar={<nav aria-label="Pages">pages</nav>}
          drawers={drawers}
          defaultActiveDrawer="help"
        >
          <div style={{ blockSize: 3000 }}>page</div>
        </AppShell>,
      );
      const panel = document.querySelector("[data-slot=app-shell-panel]") as HTMLElement;
      const main = document.querySelector("[data-slot=app-shell-main]") as HTMLElement;
      for (const scrolled of [0, 600]) {
        window.scrollTo(0, scrolled);
        await settled();
        const where = `${density}, scrolled ${scrolled}px`;
        expect(nav().getBoundingClientRect().top, where).toBe(0);
        expect(nav().getBoundingClientRect().height, where).toBe(900);
        expect(panel.getBoundingClientRect().top, where).toBe(0);
        expect(panel.getBoundingClientRect().height, where).toBe(900);
      }
      window.scrollTo(0, 0);
      expect(main.getBoundingClientRect().top, density).toBe(0);
      // Below the large window class, the panel overlays the page from the top, too.
      await page.viewport(1000, 900);
      expect(panel.getBoundingClientRect().top, density).toBe(0);
      expect(panel.getBoundingClientRect().height, density).toBe(900);
      await unmount();
    }
  });

  it("starts the navigation under the bar, at every density", async () => {
    await page.viewport(1440, 900);
    for (const [density, bar] of [
      ["compact", 48],
      ["default", 56],
      ["comfortable", 60],
    ] as const) {
      const { unmount } = await render(
        <AppShell
          density={density}
          topBar={<TopBar product="Qeet ID" />}
          sidebar={<nav aria-label="Pages">pages</nav>}
        >
          page
        </AppShell>,
      );
      const top = document.querySelector("[data-slot=app-shell-top]") as HTMLElement;
      expect(top.getBoundingClientRect().height, density).toBe(bar);
      expect(nav().getBoundingClientRect().top, density).toBe(bar);
      expect(nav().getBoundingClientRect().height, density).toBe(900 - bar);
      await unmount();
    }
  });

  it("marks each part of the frame with its slot", async () => {
    await page.viewport(1440, 900);
    await render(
      <AppShell
        topBar={<TopBar product="Qeet ID" />}
        sidebar={<nav aria-label="Pages">pages</nav>}
        drawers={[
          { id: "help", label: "Help", icon: CircleQuestionMarkIcon, content: "Help text" },
        ]}
        defaultActiveDrawer="help"
      >
        page
      </AppShell>,
    );
    for (const part of [
      "app-shell-top",
      "app-shell-nav",
      "app-shell-nav-panel",
      "app-shell-nav-body",
      "app-shell-nav-foot",
      "app-shell-collapse",
      "app-shell-main",
      "app-shell-panel",
      "app-shell-panel-header",
      "app-shell-panel-title",
      "app-shell-panel-body",
    ]) {
      expect(document.querySelectorAll(`[data-slot=${part}]`), part).toHaveLength(1);
    }
    expect(page.getByRole("button", { name: "Collapse" }).element().getAttribute("data-slot")).toBe(
      "app-shell-collapse",
    );
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

  it("embedded, fills its box: no <main> or skip link, the page scrolling inside it", async () => {
    await page.viewport(1440, 900);
    const { container } = await render(
      <main>
        <div style={{ inlineSize: 900, blockSize: 500 }}>
          <AppShell
            embedded
            topBar={<TopBar product="Qeet ID" />}
            sidebar={<nav aria-label="Qeet ID">Users</nav>}
          >
            <div style={{ blockSize: 2000 }}>A long page</div>
          </AppShell>
        </div>
      </main>,
    );
    const shell = container.querySelector("[data-slot=app-shell]") as HTMLElement;
    expect(page.getByRole("main").elements()).toHaveLength(1);
    expect(page.getByRole("link", { name: "Skip to main content" }).elements()).toHaveLength(0);
    const box = shell.getBoundingClientRect();
    expect([Math.round(box.width), Math.round(box.height)]).toEqual([900, 500]);
    expect(Math.round(nav().getBoundingClientRect().bottom)).toBe(Math.round(box.bottom));
    const content = container.querySelector("[data-slot=app-shell-main]") as HTMLElement;
    expect(content.tagName).toBe("DIV");
    expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
  });

  it("embedded, follows its box's width: a narrow box opens the navigation inside it", async () => {
    await page.viewport(1440, 900);
    const { container } = await render(
      <div style={{ inlineSize: 600, blockSize: 400 }}>
        <AppShell
          embedded
          topBar={<TopBar product="Qeet ID" />}
          sidebar={<nav aria-label="Qeet ID">Users</nav>}
        >
          Page
        </AppShell>
      </div>,
    );
    expect(getComputedStyle(nav()).display).toBe("none");
    await page.getByRole("button", { name: "Open navigation" }).click();
    const drawer = page.getByRole("dialog", { name: "Navigation" });
    await expect.element(drawer).toBeVisible();
    const shell = container.querySelector("[data-slot=app-shell]") as HTMLElement;
    expect(shell.contains(drawer.element())).toBe(true);
    const viewport = shell.querySelector(".qx-app-shell-viewport") as HTMLElement;
    expect(Math.round(viewport.getBoundingClientRect().width)).toBe(600);
  });

  it("embedded, lays out its TopBar and PageHeader by its box's width, not the window's", async () => {
    const framed = (width: number) => (
      <div style={{ inlineSize: width, blockSize: 500 }}>
        <AppShell
          embedded
          topBar={
            <TopBar product="Qeet ID" search={<TopBarSearch placeholder="Search or jump to…" />} />
          }
          sidebar={<nav aria-label="Qeet ID">Users</nav>}
        >
          <PageHeader title="Users" headingLevel={2} />
        </AppShell>
      </div>
    );
    const parts = (container: HTMLElement) => ({
      bar: container.querySelector("[data-slot=top-bar]") as HTMLElement,
      search: container.querySelector(".qx-top-bar-search") as HTMLElement,
      header: container.querySelector("[data-slot=page-header]") as HTMLElement,
    });
    const gutter = (header: HTMLElement) =>
      getComputedStyle(header).getPropertyValue("--qx-page-gutter").trim();
    const narrow = getComputedStyle(document.documentElement)
      .getPropertyValue("--qx-space-inset-lg")
      .trim();
    // A narrow box on a wide window: the bar is compact, its search gone, the gutter narrow.
    await page.viewport(1440, 900);
    const small = await render(framed(700));
    let { bar, search, header } = parts(small.container);
    await expect.poll(() => bar.hasAttribute("data-compact")).toBe(true);
    expect(getComputedStyle(search).display).toBe("none");
    expect(gutter(header)).toBe(narrow);
    small.unmount();
    // A wide box on a narrow window: the bar and the gutter are a desktop's, as the shell is.
    await page.viewport(700, 900);
    const large = await render(framed(1100));
    ({ bar, search, header } = parts(large.container));
    await expect.poll(() => bar.hasAttribute("data-compact")).toBe(false);
    expect(getComputedStyle(search).display).not.toBe("none");
    expect(gutter(header)).not.toBe(narrow);
    await page.viewport(1440, 900);
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(1440, 900);
    const { container } = await render(<QeetIdConsole density="inherit" />);
    await expectAccessible(container);
    await screenshotEveryMode("AppShell", null);
  });
});

/** An assistant panel with its header actions and its shortcut, beside a plain Help panel. */
const ASSISTANT: AppShellDrawer[] = [
  {
    id: "assistant",
    label: "Qeet AI",
    icon: ActivityIcon,
    content: "Ask anything",
    shortcut: { keys: "Meta+J Control+J", label: "⌘J" },
    actions: (
      <>
        <IconButton icon={PlusIcon} aria-label="New conversation" size="sm" tone="neutral" />
        <IconButton icon={ActivityIcon} aria-label="History" size="sm" tone="neutral" />
      </>
    ),
  },
  { id: "help", label: "Help", icon: CircleQuestionMarkIcon, content: "Help text" },
];

describe("AppShell drawers: header actions and a shortcut", () => {
  const tooltip = () => document.querySelector("[data-slot=tooltip-popup]");
  /** Tabs until the element has focus, as a keyboard user reaches it. */
  async function tabTo(element: Element) {
    for (let step = 0; step < 20 && document.activeElement !== element; step++) await tab();
    expect(document.activeElement).toBe(element);
  }

  it("puts a drawer's actions in its header before Close, after the title in the Tab order", async () => {
    await page.viewport(1440, 900);
    const { container } = await render(
      <AppShell
        topBar={<TopBar product="Qeet ID" />}
        drawers={ASSISTANT}
        defaultActiveDrawer="assistant"
      >
        page
      </AppShell>,
    );
    const header = container.querySelector("[data-slot=app-shell-panel-header]") as HTMLElement;
    expect([...header.children].map((part) => part.getAttribute("data-slot"))).toEqual([
      "app-shell-panel-title",
      "app-shell-panel-actions",
      "icon-button",
    ]);
    const buttons = [...header.querySelectorAll("button")];
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "New conversation",
      "History",
      "Close panel",
    ]);
    // In the header's size and tone, Close's: one row at the header's end, the title at its start.
    const box = (element: Element) => element.getBoundingClientRect();
    const close = buttons[2] as HTMLButtonElement;
    for (const button of buttons.slice(0, 2)) {
      expect(box(button).height).toBe(box(close).height);
      expect(box(button).top).toBe(box(close).top);
      expect(button.dataset.tone).toBe("neutral");
      expect(button.dataset.size).toBe("sm");
    }
    expect(box(buttons[1] as Element).right).toBeLessThanOrEqual(box(close).left);
    expect(box(buttons[0] as Element).left).toBeGreaterThan(
      box(header.querySelector("h2") as Element).left + 60,
    );
    expect(box(close).right).toBeGreaterThan(box(header).right - 16);
    // The keyboard reaches them in that order.
    await tabTo(buttons[0] as Element);
    await tab();
    expect(document.activeElement).toBe(buttons[1]);
    await tab();
    expect(document.activeElement).toBe(close);
    await expectAccessible(container);
  });

  it("shows a drawer's shortcut in its trigger's tooltip and sets it as aria-keyshortcuts", async () => {
    await page.viewport(1440, 900);
    await render(
      <AppShell topBar={<TopBar product="Qeet ID" />} drawers={ASSISTANT}>
        page
      </AppShell>,
    );
    const trigger = page.getByRole("button", { name: "Qeet AI" });
    await expect.element(trigger).toHaveAttribute("aria-keyshortcuts", "Meta+J Control+J");
    await tabTo(trigger.element());
    await expect.poll(() => tooltip()?.textContent).toBe("Qeet AI ⌘J");
    // A drawer without one is as before: its label in the tooltip, no aria-keyshortcuts.
    const help = page.getByRole("button", { name: "Help" });
    expect(help.element().hasAttribute("aria-keyshortcuts")).toBe(false);
    await tab();
    await expect.element(help).toHaveFocus();
    await expect.poll(() => tooltip()?.textContent).toBe("Help");
  });

  it("shows the shortcut in the phone's Tools menu too", async () => {
    await page.viewport(390, 700);
    await render(
      <AppShell topBar={<TopBar product="Qeet ID" />} drawers={ASSISTANT}>
        page
      </AppShell>,
    );
    await page.getByRole("button", { name: "Tools" }).click();
    const item = page.getByRole("menuitemcheckbox", { name: "Qeet AI" });
    await expect.element(item).toHaveAttribute("aria-keyshortcuts", "Meta+J Control+J");
    expect(item.element().querySelector("[data-slot=menu-shortcut]")?.textContent).toBe("⌘J");
    const help = page.getByRole("menuitemcheckbox", { name: "Help" }).element();
    expect(help.hasAttribute("aria-keyshortcuts")).toBe(false);
    expect(help.querySelector("[data-slot=menu-shortcut]")).toBeNull();
  });

  it("leaves a drawer without actions as it was", async () => {
    await page.viewport(1440, 900);
    const { container } = await render(
      <AppShell
        topBar={<TopBar product="Qeet ID" />}
        drawers={ASSISTANT}
        defaultActiveDrawer="help"
      >
        page
      </AppShell>,
    );
    expect(container.querySelector("[data-slot=app-shell-panel-actions]")).toBeNull();
    const header = container.querySelector("[data-slot=app-shell-panel-header]") as HTMLElement;
    expect(header.querySelectorAll("button")).toHaveLength(1);
  });

  it("looks right in every mode with header actions", async () => {
    await page.viewport(1100, 500);
    await render(
      <AppShell
        topBar={<TopBar product="Qeet ID" />}
        drawers={ASSISTANT}
        defaultActiveDrawer="assistant"
      >
        page
      </AppShell>,
    );
    await screenshotEveryMode("AppShell · panel actions", "[data-slot=app-shell-panel]");
  });
});
