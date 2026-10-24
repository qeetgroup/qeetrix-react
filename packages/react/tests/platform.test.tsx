import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Probe } from "./fixtures/probe";
import { expectAccessible } from "./support/axe";
import { screenshotEveryMode } from "./support/screenshots";
import { Stage } from "./support/stage";

describe("platform: real browser", () => {
  it("renders in Chromium and takes keyboard focus", async () => {
    await render(<Probe />);
    const button = page.getByRole("button", { name: "Save changes" });
    await expect.element(button).toBeVisible();
    await userEvent.keyboard("{Tab}");
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

  it("captures one screenshot per colour scheme and density", async () => {
    await render(
      <Stage>
        <Probe />
      </Stage>,
    );
    await screenshotEveryMode("platform probe");
  });
});
