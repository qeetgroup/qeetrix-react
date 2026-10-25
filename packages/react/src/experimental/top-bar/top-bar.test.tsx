import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "../../menu/menu";
import { TopBar, TopBarSearch, TopBarSwitcher } from "./top-bar";

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

describe("TopBar", () => {
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
    await page.viewport(1100, 200);
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
    await page.viewport(1100, 200);
    const { container } = await render(<Bar />);
    await expectAccessible(container);
    await screenshotEveryMode("TopBar", "[data-slot=top-bar]");
  });
});
