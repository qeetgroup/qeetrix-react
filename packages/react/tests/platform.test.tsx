import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Probe } from "./fixtures/probe";
import { expectAccessible } from "./support/axe";
import { tab } from "./support/keyboard";
import { screenshotEveryMode } from "./support/screenshots";
import { Stage } from "./support/stage";

describe("platform: real browser", () => {
  it("renders in Chromium and takes keyboard focus", async () => {
    await render(<Probe />);
    const button = page.getByRole("button", { name: "Save changes" });
    await expect.element(button).toBeVisible();
    await tab();
    await expect.element(button).toHaveFocus();
  });

  it("runs axe with every WCAG A and AA rule", async () => {
    const { container } = await render(<Probe />);
    await expectAccessible(container);
  });

  it("fails axe when a control has no accessible name", async () => {
    const { container } = await render(<Probe label="" />);
    await expect(expectAccessible(container)).rejects.toThrow(/button-name/);
  });

  it("switches density: control height 28, 32 and 36px", async () => {
    const { container } = await render(<Probe />);
    const probe = container.querySelector("[data-slot=probe]") as HTMLElement;
    const html = document.documentElement;
    const heights: Record<string, number> = {};
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      heights[density] = probe.getBoundingClientRect().height;
    }
    delete html.dataset.qxDensity;
    expect(heights).toEqual({ compact: 28, default: 32, comfortable: 36 });
  });

  it("captures one screenshot per colour scheme and density", async () => {
    await render(
      <Stage>
        <Probe />
      </Stage>,
    );
    await screenshotEveryMode("platform probe");
  });
});
