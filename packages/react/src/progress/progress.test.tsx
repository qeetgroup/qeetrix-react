import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Stack } from "../stack/stack";
import { Meter, Progress } from "./progress";

describe("Progress", () => {
  it("is a named progressbar with its value, and fills the track to it", async () => {
    const { container } = await render(
      <Progress label="Uploading invoices.csv" showValue value={40} />,
    );
    const bar = page.getByRole("progressbar", { name: "Uploading invoices.csv" });
    await expect.element(bar).toHaveAttribute("aria-valuenow", "40");
    expect(container.querySelector(".qx-progress-value")?.textContent).toBe("40%");
    const track = container.querySelector("[data-slot=progress-track]") as HTMLElement;
    const indicator = container.querySelector("[data-slot=progress-indicator]") as HTMLElement;
    expect(
      indicator.getBoundingClientRect().width / track.getBoundingClientRect().width,
    ).toBeCloseTo(0.4, 2);
  });

  it("is indeterminate with a null value, a sliding 30% segment", async () => {
    const { container } = await render(<Progress aria-label="Importing" value={null} />);
    await expect
      .element(page.getByRole("progressbar", { name: "Importing" }))
      .not.toHaveAttribute("aria-valuenow");
    const indicator = container.querySelector("[data-slot=progress-indicator]") as HTMLElement;
    expect(getComputedStyle(indicator).animationName).toBe("qx-progress-slide");
  });
});

describe("Meter", () => {
  it("is a named meter with a status tone", async () => {
    const { container } = await render(
      <Meter label="Storage" showValue value={92} tone="danger" />,
    );
    await expect
      .element(page.getByRole("meter", { name: "Storage" }))
      .toHaveAttribute("aria-valuenow", "92");
    const indicator = container.querySelector("[data-slot=meter-indicator]") as HTMLElement;
    expect(getComputedStyle(indicator).backgroundColor).toBe(
      tokenColor("--qx-color-bg-danger-bold"),
    );
  });
});

describe("Progress and Meter", () => {
  it("are accessible and look right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <Stack gap="lg" style={{ inlineSize: 280 }}>
          <Progress label="Uploading invoices.csv" showValue value={65} />
          <Progress label="Importing customers" value={null} />
          <Meter label="Storage" showValue value={48} />
          <Meter label="SMS credits" showValue value={88} tone="warning" />
        </Stack>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Progress");
  });
});
