import { beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { QeetIdFrame } from "../../../tests/fixtures/qeet-id-console";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "../../menu/menu";
import { TopBar, TopBarScopeName, TopBarSearch, TopBarSwitcher } from "./top-bar";

function Bar({ onSearch }: { onSearch?: () => void }) {
  return (
    <TopBar
      product="Qeet Pay"
      href="#home"
      context={
        <>
          <Menu>
            <MenuTrigger render={<TopBarSwitcher mark="AC" label="Acme Pvt Ltd" />} />
            <MenuContent>
              <MenuItem>Acme Pvt Ltd</MenuItem>
              <MenuItem>Acme Labs</MenuItem>
            </MenuContent>
          </Menu>
          <TopBarSwitcher status="warning" label="Development" />
        </>
      }
      search={
        <TopBarSearch
          placeholder="Search or jump to…"
          shortcut={["⌘", "K"]}
          aria-keyshortcuts="Meta+K"
          onClick={onSearch}
        />
      }
    />
  );
}

/** A console whose scope is its organisation's name, not a control: switching is elsewhere. */
function NamedBar({ env }: { env?: "switcher" | "name" }) {
  return (
    <TopBar
      product="Qeet ID"
      href="#home"
      context={
        <>
          <TopBarScopeName mark="AC" label="Acme Pvt Ltd" />
          {env === "switcher" && (
            <Menu>
              <MenuTrigger render={<TopBarSwitcher status="success" label="Production" />} />
              <MenuContent>
                <MenuItem>Production</MenuItem>
                <MenuItem>Development</MenuItem>
              </MenuContent>
            </Menu>
          )}
          {env === "name" && <TopBarScopeName status="warning" label="Development" />}
        </>
      }
    />
  );
}

const bar = () => document.querySelector("[data-slot=top-bar]") as HTMLElement;
const box = (element: Element) => element.getBoundingClientRect();

/** A token's value as the dark scheme resolves it. */
function darkToken(token: `--qx-${string}`): string {
  const probe = document.createElement("span");
  probe.dataset.qxColorScheme = "dark";
  probe.style.color = `var(${token})`;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/** The bar's controls on screen, left to right. */
function controls(): DOMRect[] {
  const bar = document.querySelector("[data-slot=top-bar]") as HTMLElement;
  return [...bar.querySelectorAll<HTMLElement>("a, button")]
    .map((element) => element.getBoundingClientRect())
    .filter((box) => box.width > 1 && box.height > 1)
    .sort((a, b) => a.left - b.left);
}

describe("TopBar", () => {
  beforeEach(async () => {
    await page.viewport(1100, 200);
  });

  it("is the banner, with the product's name linking home", async () => {
    await render(<Bar />);
    await expect.element(page.getByRole("banner")).toBeVisible();
    await expect
      .element(page.getByRole("link", { name: "Qeet Pay" }))
      .toHaveAttribute("href", "#home");
  });

  it("is black over a light page, topped by a 2px Ember line", async () => {
    const { container } = await render(<Bar />);
    const bar = container.querySelector("[data-slot=top-bar]") as HTMLElement;
    expect(bar.dataset.qxColorScheme).toBe("dark");
    const style = getComputedStyle(bar);
    expect(style.backgroundColor).toBe(darkToken("--qx-color-surface-sunken"));
    expect(style.borderTopWidth).toBe("2px");
    expect(style.borderTopColor).toBe(darkToken("--qx-color-border-brand"));
    expect(getComputedStyle(document.body).color).not.toBe(tokenColor("--qx-color-text-inverse"));
  });

  it("draws a slash before each step of the scope, through fragments", async () => {
    const { container } = await render(<Bar />);
    const slashes = container.querySelectorAll(".qx-top-bar-slash");
    expect(slashes).toHaveLength(2);
    for (const slash of slashes) expect(slash.getAttribute("aria-hidden")).toBe("true");
  });

  it("switches scope from a TopBarSwitcher used as a menu trigger", async () => {
    await render(<Bar />);
    const switcher = page.getByRole("button", { name: "Acme Pvt Ltd" });
    await switcher.click();
    await expect.element(page.getByRole("menuitem", { name: "Acme Labs" })).toBeVisible();
    await expect.element(switcher).toHaveAttribute("aria-expanded", "true");
  });

  it("names an environment in words; its dot is decoration", async () => {
    await render(<Bar />);
    const env = page.getByRole("button", { name: "Development" }).element();
    const dot = env.querySelector(".qx-top-bar-status") as HTMLElement;
    expect(dot.getAttribute("aria-hidden")).toBe("true");
    expect(getComputedStyle(dot).backgroundColor).toBe(darkToken("--qx-color-bg-warning-bold"));
  });

  it("opens search from a button named by its prompt, showing the shortcut", async () => {
    const onSearch = vi.fn();
    await render(<Bar onSearch={onSearch} />);
    const search = page.getByRole("button", { name: "Search or jump to…" });
    await expect.element(search).toHaveAttribute("aria-keyshortcuts", "Meta+K");
    expect([...search.element().querySelectorAll("kbd")].map((key) => key.textContent)).toEqual([
      "⌘",
      "K",
    ]);
    await search.click();
    expect(onSearch).toHaveBeenCalledOnce();
  });

  it("hides its search below 840px", async () => {
    await page.viewport(700, 400);
    await render(<Bar />);
    const search = document.querySelector("[data-slot=top-bar-search]") as HTMLElement;
    expect(getComputedStyle(search).display).toBe("none");
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(<Bar />);
    await expectAccessible(container);
    await screenshotEveryMode("TopBar", "[data-slot=top-bar]");
  });

  it("shows a TopBarScopeName as a name, not a button, in a switcher's box", async () => {
    const { container } = await render(<NamedBar env="switcher" />);
    const name = container.querySelector("[data-slot=top-bar-scope-name]") as HTMLElement;
    expect(name.tagName).toBe("SPAN");
    expect(page.getByRole("button", { name: /Acme/ }).query()).toBeNull();
    expect(name.querySelector("svg")).toBeNull();
    await expect.element(page.getByText("Acme Pvt Ltd")).toBeVisible();
    const mark = name.querySelector(".qx-top-bar-mark") as HTMLElement;
    expect(mark.getAttribute("aria-hidden")).toBe("true");
    expect([box(mark).width, box(mark).height]).toEqual([20, 20]);
    // The same box as the switcher after it, so the path's labels sit on one line.
    const switcher = page.getByRole("button", { name: "Production" }).element();
    expect(box(name).height).toBe(box(switcher).height);
    expect(getComputedStyle(name).paddingInlineStart).toBe(
      getComputedStyle(switcher).paddingInlineStart,
    );
    const label = (element: Element) =>
      element.querySelector(".qx-top-bar-switcher-label") as HTMLElement;
    expect(getComputedStyle(label(name)).font).toBe(getComputedStyle(label(switcher)).font);
    // Within half a pixel: WebKit rounds a button's content differently from a span's.
    expect(Math.abs(box(label(name)).top - box(label(switcher)).top)).toBeLessThanOrEqual(0.5);
    expect(container.querySelectorAll(".qx-top-bar-slash")).toHaveLength(2);
    await expectAccessible(container);
  });
});

describe("TopBar, compact (below 840px)", () => {
  it("overlaps nothing at 390 and 768px, at every density", async () => {
    for (const width of [390, 768]) {
      await page.viewport(width, 400);
      const screen = await render(<QeetIdFrame>page</QeetIdFrame>);
      const bar = (
        document.querySelector("[data-slot=top-bar]") as HTMLElement
      ).getBoundingClientRect();
      for (const density of ["compact", "default", "comfortable"]) {
        // The frame sets compact density; its default is what the page inherits.
        const shell = document.querySelector("[data-slot=app-shell]") as HTMLElement;
        shell.dataset.qxDensity = density;
        const boxes = controls();
        const where = `${width}px, ${density}`;
        for (const [index, box] of boxes.entries()) {
          expect(box.left, where).toBeGreaterThanOrEqual(bar.left);
          expect(box.right, where).toBeLessThanOrEqual(bar.right);
          const next = boxes[index + 1];
          if (next) expect(next.left, where).toBeGreaterThanOrEqual(box.right - 0.5);
        }
        // At the consoles' compact density, the one switcher's label shows whole even at 390px;
        // in roomier densities it's what gives way, with an ellipsis.
        const label = document.querySelector(
          "[data-slot=top-bar-scope] .qx-top-bar-switcher-label",
        ) as HTMLElement;
        if (density === "compact" || width === 768)
          expect(label.scrollWidth, where).toBeLessThanOrEqual(label.clientWidth + 1);
        else expect(getComputedStyle(label).textOverflow, where).toBe("ellipsis");
      }
      await screen.unmount();
    }
  });

  it("collapses the scope path into one switcher showing its innermost step", async () => {
    await page.viewport(768, 400);
    await render(<QeetIdFrame>page</QeetIdFrame>);
    const scope = page.getByRole("button", { name: "Scope Production" });
    await expect.element(scope).toBeVisible();
    expect(scope.element().querySelector(".qx-top-bar-status")?.getAttribute("data-status")).toBe(
      "success",
    );
    // One slash, before the one switcher; the full path is a tap away.
    expect(document.querySelectorAll("[data-slot=top-bar] .qx-top-bar-slash")).toHaveLength(1);
    await scope.click();
    const path = page.getByRole("dialog", { name: "Scope" });
    await expect.element(path).toBeVisible();
    // Each step is its own switcher, still opening its own menu.
    await path.getByRole("button", { name: "Acme Pvt Ltd" }).click();
    await page.getByRole("menuitem", { name: "Acme Labs" }).click();
    await expect.element(page.getByRole("menuitem")).not.toBeInTheDocument();
  });

  it("shows a scope that is only a name on its own, with its mark, at 375px", async () => {
    await page.viewport(375, 400);
    const { container } = await render(<NamedBar />);
    // Nothing to switch, so no button: the name itself, as at desktop width.
    expect(container.querySelector("[data-slot=top-bar-scope]")).toBeNull();
    expect(page.getByRole("button").query()).toBeNull();
    expect(bar().textContent).not.toContain("Scope");
    const name = container.querySelector("[data-slot=top-bar-scope-name]") as HTMLElement;
    const label = name.querySelector(".qx-top-bar-switcher-label") as HTMLElement;
    await expect.element(page.getByText("Acme Pvt Ltd")).toBeVisible();
    expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth + 1);
    expect(box(name).right).toBeLessThanOrEqual(box(bar()).right);
    expect(name.querySelector(".qx-top-bar-mark")?.textContent).toBe("AC");
    expect(container.querySelectorAll(".qx-top-bar-slash")).toHaveLength(1);
    await expectAccessible(container);
  });

  it("shows only the innermost name when every step is one", async () => {
    await page.viewport(375, 400);
    const { container } = await render(<NamedBar env="name" />);
    expect(page.getByRole("button").query()).toBeNull();
    const names = container.querySelectorAll("[data-slot=top-bar-scope-name]");
    expect([...names].map((name) => name.textContent)).toEqual(["Development"]);
    expect(names[0]?.querySelector(".qx-top-bar-status")?.getAttribute("data-status")).toBe(
      "warning",
    );
  });

  it("shows a name on the one switcher when it's the innermost step", async () => {
    await page.viewport(375, 400);
    await render(
      <TopBar
        product="Qeet ID"
        context={
          <>
            <Menu>
              <MenuTrigger render={<TopBarSwitcher mark="AC" label="Acme Pvt Ltd" />} />
              <MenuContent>
                <MenuItem>Acme Labs</MenuItem>
              </MenuContent>
            </Menu>
            <TopBarScopeName status="warning" label="Development" />
          </>
        }
      />,
    );
    const scope = page.getByRole("button", { name: "Scope Development" });
    await expect.element(scope).toBeVisible();
    expect(scope.element().querySelector(".qx-top-bar-status")?.getAttribute("data-status")).toBe(
      "warning",
    );
    await scope.click();
    const path = page.getByRole("dialog", { name: "Scope" });
    await expect.element(path.getByRole("button", { name: "Acme Pvt Ltd" })).toBeVisible();
    await expect.element(path.getByText("Development")).toBeVisible();
  });

  it("opens a path that holds a name and a switcher, the name as text", async () => {
    await page.viewport(375, 400);
    await render(<NamedBar env="switcher" />);
    const scope = page.getByRole("button", { name: "Scope Production" });
    await expect.element(scope).toBeVisible();
    await scope.click();
    const path = page.getByRole("dialog", { name: "Scope" });
    const name = path.getByText("Acme Pvt Ltd");
    await expect.element(name).toBeVisible();
    expect(name.element().closest("button")).toBeNull();
    // In the popup the name fills its row, as each switcher does.
    const row = name.element().closest("[data-slot=top-bar-scope-name]") as HTMLElement;
    const switcher = path.getByRole("button", { name: "Production" }).element();
    expect(box(row).width).toBe(box(switcher).width);
    expect(box(row).left).toBe(box(switcher).left);
  });

  it("says Scope on its switcher while no step reports what it shows", async () => {
    await page.viewport(375, 400);
    await render(<TopBar product="Qeet ID" context={<span>Acme Pvt Ltd</span>} />);
    await expect.element(page.getByRole("button", { name: "Scope" })).toBeVisible();
  });

  it("keeps the product's name for its link on a phone, showing the logo alone", async () => {
    await page.viewport(390, 400);
    await render(<QeetIdFrame>page</QeetIdFrame>);
    const home = page.getByRole("link", { name: "Qeet ID" });
    await expect.element(home).toBeVisible();
    const name = home.element().querySelector(".qx-top-bar-product") as HTMLElement;
    expect(name.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    // From 600px the name shows again.
    await page.viewport(768, 400);
    await expect.poll(() => name.getBoundingClientRect().width).toBeGreaterThan(20);
  });

  it("collapses the panel triggers into one Tools menu on a phone", async () => {
    await page.viewport(390, 600);
    await render(<QeetIdFrame>page</QeetIdFrame>);
    expect(page.getByRole("button", { name: "Help" }).query()).toBeNull();
    const tools = page.getByRole("button", { name: "Tools" });
    await tools.click();
    await page.getByRole("menuitemcheckbox", { name: "Help" }).click();
    await expect.element(page.getByRole("complementary", { name: "Help" })).toBeVisible();
    await tools.click();
    await expect
      .element(page.getByRole("menuitemcheckbox", { name: "Help" }))
      .toHaveAttribute("aria-checked", "true");
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(390, 200);
    const { container } = await render(<Bar />);
    await expectAccessible(container);
    await screenshotEveryMode("TopBar · compact", "[data-slot=top-bar]");
  });

  it("looks right in every mode with a scope that is a name", async () => {
    await page.viewport(390, 200);
    await render(<NamedBar />);
    await screenshotEveryMode("TopBar · compact · scope name", "[data-slot=top-bar]");
  });
});
