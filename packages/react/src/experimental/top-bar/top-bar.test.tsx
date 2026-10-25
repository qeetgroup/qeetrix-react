import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { tokenColor } from "../../../tests/support/color";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { Button } from "../../button/button";
import { Input } from "../../input/input";
import { TopBar } from "./top-bar";

function Bar() {
  return (
    <TopBar
      product="Qeet Pay"
      href="#home"
      context={
        <Button variant="ghost" tone="neutral" size="sm">
          Acme Pvt Ltd
        </Button>
      }
      search={<Input aria-label="Search Qeet Pay" placeholder="Search payments" />}
    />
  );
}

describe("TopBar", () => {
  it("is the banner, with the product's name linking home", async () => {
    await render(<Bar />);
    await expect.element(page.getByRole("banner")).toBeVisible();
    await expect
      .element(page.getByRole("link", { name: "Qeet Pay" }))
      .toHaveAttribute("href", "#home");
  });

  it("is the dark scheme over a light page", async () => {
    const { container } = await render(<Bar />);
    const bar = container.querySelector("[data-slot=top-bar]") as HTMLElement;
    expect(bar.dataset.qxColorScheme).toBe("dark");
    const probe = document.createElement("span");
    probe.dataset.qxColorScheme = "dark";
    probe.style.color = "var(--qx-color-surface-sunken)";
    document.body.append(probe);
    expect(getComputedStyle(bar).backgroundColor).toBe(getComputedStyle(probe).color);
    probe.remove();
    expect(getComputedStyle(document.body).color).not.toBe(tokenColor("--qx-color-text-inverse"));
  });

  it("hides its search below 840px", async () => {
    await page.viewport(700, 400);
    await render(<Bar />);
    const search = document.querySelector("[data-slot=top-bar-search]") as HTMLElement;
    expect(getComputedStyle(search).display).toBe("none");
  });

  it("looks right in every mode", async () => {
    await page.viewport(1100, 200);
    await render(<Bar />);
    await screenshotEveryMode("TopBar", "[data-slot=top-bar]");
  });
});
