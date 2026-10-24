import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Stack } from "../stack/stack";
import { Switch } from "./switch";

describe("Switch", () => {
  it("is a switch named by its label that applies at once", async () => {
    const onCheckedChange = vi.fn();
    await render(<Switch label="Auto-renew" onCheckedChange={onCheckedChange} />);
    const control = page.getByRole("switch", { name: "Auto-renew" });
    await page.getByText("Auto-renew").click();
    await expect.element(control).toBeChecked();
    expect(onCheckedChange).toHaveBeenLastCalledWith(true, expect.anything());
    await userEvent.keyboard(" ");
    await expect.element(control).not.toBeChecked();
  });

  it("moves the thumb to the end side, in both directions", async () => {
    const { container } = await render(
      <>
        <Switch aria-label="Left to right" defaultChecked />
        <div dir="rtl">
          <Switch aria-label="Right to left" defaultChecked />
        </div>
      </>,
    );
    const [ltr, rtl] = [...container.querySelectorAll("[data-slot=switch-track]")] as HTMLElement[];
    const offset = (track: HTMLElement) => {
      const thumb = track.querySelector("[data-slot=switch-thumb]") as HTMLElement;
      return thumb.getBoundingClientRect().left - track.getBoundingClientRect().left;
    };
    // 1px border + 16px inset on the end side; the thumb is 12px in a 32px track.
    expect(offset(ltr as HTMLElement)).toBe(17);
    expect(offset(rtl as HTMLElement)).toBe(3);
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <Stack gap="xs">
          <Switch label="Auto-renew" defaultChecked />
          <Switch label="Send receipts" description="To the billing contact." />
          <Switch label="Managed by your admin" disabled defaultChecked />
        </Stack>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Switch");
  });
});
