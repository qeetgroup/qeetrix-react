import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { VisuallyHidden } from "./visually-hidden";

describe("VisuallyHidden", () => {
  it("names a control for screen readers while taking no visible space", async () => {
    const { container } = await render(
      <button type="button">
        ×<VisuallyHidden>Close dialog</VisuallyHidden>
      </button>,
    );
    await expect.element(page.getByRole("button", { name: /Close dialog$/ })).toBeVisible();
    const hidden = container.querySelector("[data-slot=visually-hidden]") as HTMLElement;
    expect(hidden.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    expect(getComputedStyle(hidden).display).not.toBe("none");
    await expectAccessible(container);
  });
});
