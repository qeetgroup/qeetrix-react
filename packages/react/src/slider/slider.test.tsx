import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tab } from "../../tests/support/keyboard";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Stack } from "../stack/stack";
import { Slider } from "./slider";

describe("Slider", () => {
  it("is named by its label, steps with the arrow keys and shows the formatted value", async () => {
    const onValueChange = vi.fn();
    const { container } = await render(
      <Slider
        label="Discount"
        showValue
        defaultValue={0.1}
        min={0}
        max={0.5}
        step={0.05}
        format={{ style: "percent" }}
        onValueChange={onValueChange}
      />,
    );
    const thumb = page.getByRole("slider", { name: "Discount" });
    await expect.element(thumb).toHaveAttribute("aria-valuenow", "0.1");
    await tab();
    await expect.element(thumb).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenLastCalledWith(0.15, expect.anything());
    expect(container.querySelector("[data-slot=slider-value]")?.textContent).toBe("15%");
  });

  it("renders a thumb per value for a range, named Minimum and Maximum", async () => {
    await render(<Slider label="Amount" defaultValue={[1000, 5000]} min={0} max={10000} />);
    await expect
      .element(page.getByRole("slider", { name: /Minimum/ }))
      .toHaveAttribute("aria-valuenow", "1000");
    await expect
      .element(page.getByRole("slider", { name: /Maximum/ }))
      .toHaveAttribute("aria-valuenow", "5000");
  });

  it("has a 24px pointer row and a 16px square thumb", async () => {
    const { container } = await render(<Slider aria-label="Volume" defaultValue={50} />);
    const control = container.querySelector("[data-slot=slider-control]") as HTMLElement;
    const thumb = container.querySelector("[data-slot=slider-thumb]") as HTMLElement;
    expect(control.getBoundingClientRect().height).toBe(24);
    expect(thumb.getBoundingClientRect().width).toBe(16);
    expect(getComputedStyle(thumb).borderRadius).toBe("2px");
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <Stack gap="xl" style={{ inlineSize: 280 }}>
          <Slider
            label="Discount"
            showValue
            defaultValue={0.15}
            max={0.5}
            step={0.05}
            format={{ style: "percent" }}
          />
          <Slider
            label="Invoice amount"
            showValue
            defaultValue={[25000, 75000]}
            max={100000}
            step={5000}
            format={{ style: "currency", currency: "INR", maximumFractionDigits: 0 }}
          />
          <Slider label="Retention" showValue defaultValue={30} max={90} disabled />
        </Stack>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Slider");
  });
});
