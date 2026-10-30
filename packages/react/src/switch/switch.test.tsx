import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { settled } from "../../tests/support/settled";
import { Stage } from "../../tests/support/stage";
import { Field } from "../field/field";
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

  it("keeps an invalid track's danger edge under the pointer, on or off (QTRX-161)", async () => {
    await render(
      <Field label="Notifications" error="Turn on at least one.">
        <Switch label="Email" />
        <Switch label="SMS" defaultChecked />
      </Field>,
    );
    const danger = tokenColor("--qx-color-border-danger");
    for (const name of ["Email", "SMS"]) {
      const track = page.getByRole("switch", { name }).element();
      expect(getComputedStyle(track).borderTopColor).toBe(danger);
      await userEvent.hover(track);
      await settled();
      expect(getComputedStyle(track).borderTopColor).toBe(danger);
    }
  });

  it("draws the on thumb white in both schemes, as the checkbox's tick (QTRX-162)", async () => {
    const { container } = await render(<Switch aria-label="Auto-renew" defaultChecked />);
    const thumb = container.querySelector("[data-slot=switch-thumb]") as HTMLElement;
    const html = document.documentElement;
    const seen: string[] = [];
    for (const scheme of ["light", "dark"]) {
      html.dataset.qxColorScheme = scheme;
      await settled();
      seen.push(getComputedStyle(thumb).backgroundColor);
      expect(seen.at(-1)).toBe(tokenColor("--qx-color-icon-on-brand"));
    }
    // Not the dark surface (it was surface.default, near-black in dark).
    expect(seen[1]).toBe(seen[0]);
    expect(seen[1]).not.toBe(tokenColor("--qx-color-surface-default"));
    delete html.dataset.qxColorScheme;
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
