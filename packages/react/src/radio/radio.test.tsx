import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { settled } from "../../tests/support/settled";
import { Stage } from "../../tests/support/stage";
import { Stack } from "../stack/stack";
import { Radio, RadioGroup } from "./radio";

type Cycle = "monthly" | "yearly";

describe("RadioGroup", () => {
  it("is one tab stop; arrow keys move and select", async () => {
    const onValueChange = vi.fn();
    await render(
      <RadioGroup<Cycle> label="Billing cycle" defaultValue="monthly" onValueChange={onValueChange}>
        <Radio<Cycle> value="monthly" label="Monthly" />
        <Radio<Cycle> value="yearly" label="Yearly" description="Two months free." />
      </RadioGroup>,
    );
    await expect.element(page.getByRole("radiogroup", { name: "Billing cycle" })).toBeVisible();
    await userEvent.keyboard("{Tab}");
    await expect.element(page.getByRole("radio", { name: "Monthly" })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    const yearly = page.getByRole("radio", { name: "Yearly" });
    await expect.element(yearly).toHaveFocus();
    await expect.element(yearly).toBeChecked();
    await expect.element(yearly).toHaveAccessibleDescription("Two months free.");
    expect(onValueChange).toHaveBeenLastCalledWith("yearly", expect.anything());
  });

  it("selects from the label", async () => {
    await render(
      <RadioGroup label="Plan">
        <Radio value="basic" label="Basic" />
        <Radio value="pro" label="Pro" />
      </RadioGroup>,
    );
    await page.getByText("Pro").click();
    await expect.element(page.getByRole("radio", { name: "Pro" })).toBeChecked();
  });

  it("draws the on state as a 5px ring", async () => {
    await render(
      <RadioGroup label="Plan" defaultValue="pro">
        <Radio value="pro" label="Pro" />
      </RadioGroup>,
    );
    const radio = page.getByRole("radio", { name: "Pro" }).element();
    expect(getComputedStyle(radio).borderTopWidth).toBe("5px");
    expect(radio.getBoundingClientRect().width).toBe(16);
  });

  it("keeps an invalid circle's danger edge under the pointer, chosen or not (QTRX-161)", async () => {
    await render(
      <RadioGroup label="Plan" error="Choose a plan you can pay for." defaultValue="pro">
        <Radio value="free" label="Free" />
        <Radio value="pro" label="Pro" />
      </RadioGroup>,
    );
    const danger = tokenColor("--qx-color-border-danger");
    for (const name of ["Free", "Pro"]) {
      const radio = page.getByRole("radio", { name }).element();
      expect(getComputedStyle(radio).borderTopColor).toBe(danger);
      await userEvent.hover(radio);
      await settled();
      expect(getComputedStyle(radio).borderTopColor).toBe(danger);
    }
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <Stack gap="lg">
          <RadioGroup label="Billing cycle" defaultValue="monthly">
            <Radio value="monthly" label="Monthly" />
            <Radio value="yearly" label="Yearly" description="Two months free." />
            <Radio value="custom" label="Custom" disabled />
          </RadioGroup>
          <RadioGroup
            label="Invoice language"
            defaultValue="en"
            orientation="horizontal"
            error="Choose a supported language."
          >
            <Radio value="en" label="English" />
            <Radio value="hi" label="हिन्दी" />
          </RadioGroup>
        </Stack>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Radio");
  });
});
