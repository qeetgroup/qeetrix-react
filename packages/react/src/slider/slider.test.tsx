import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tab } from "../../tests/support/keyboard";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Field } from "../field/field";
import { hi } from "../locales/hi";
import { QeetrixProvider } from "../provider/provider";
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

  it("renders a thumb per value for a range, each named after the label", async () => {
    await render(<Slider label="Amount" defaultValue={[1000, 5000]} min={0} max={10000} />);
    await expect
      .element(page.getByRole("slider", { name: "Amount, minimum", exact: true }))
      .toHaveAttribute("aria-valuenow", "1000");
    await expect
      .element(page.getByRole("slider", { name: "Amount, maximum", exact: true }))
      .toHaveAttribute("aria-valuenow", "5000");
  });

  it("names a range's thumbs after an aria-label, a label that isn't text, or neither", async () => {
    await render(
      <Stack>
        <Slider aria-label="Price" defaultValue={[10, 90]} />
        <Slider
          label={
            <>
              Retention <strong>(days)</strong>
            </>
          }
          defaultValue={[7, 30]}
        />
        <Slider defaultValue={[1, 2]} />
      </Stack>,
    );
    await expect.element(page.getByRole("group", { name: "Price" })).toBeVisible();
    for (const name of [
      "Price, minimum",
      "Price, maximum",
      "Retention (days), minimum",
      "Retention (days), maximum",
      "Minimum",
      "Maximum",
    ]) {
      await expect.element(page.getByRole("slider", { name, exact: true })).toBeInTheDocument();
    }
  });

  it("names a range's thumbs in Hindi through QeetrixProvider", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <Slider label="राशि" defaultValue={[1000, 5000]} max={10000} />
      </QeetrixProvider>,
    );
    await expect
      .element(page.getByRole("slider", { name: "राशि, न्यूनतम", exact: true }))
      .toHaveAttribute("aria-valuenow", "1000");
    await expect
      .element(page.getByRole("slider", { name: "राशि, अधिकतम", exact: true }))
      .toHaveAttribute("aria-valuenow", "5000");
  });

  it("takes a description and an error like the choice groups, linked to every thumb", async () => {
    const { container, rerender } = await render(
      <Slider
        label="Invoice amount"
        description="Invoices in this range need a second approval."
        defaultValue={[25000, 75000]}
        max={100000}
        className="placed"
      />,
    );
    const min = page.getByRole("slider", { name: "Invoice amount, minimum" });
    const max = page.getByRole("slider", { name: "Invoice amount, maximum" });
    for (const thumb of [min, max]) {
      await expect
        .element(thumb)
        .toHaveAccessibleDescription("Invoices in this range need a second approval.");
    }
    // The row is a field of its own; className still places the outermost element.
    const field = container.querySelector("[data-slot=slider-field]") as HTMLElement;
    expect(field.classList).toContain("placed");
    expect(field.querySelector("[data-slot=slider]")).not.toBeNull();
    await rerender(
      <Slider
        label="Invoice amount"
        description="Invoices in this range need a second approval."
        error="Choose a range of at least ₹10,000."
        defaultValue={[25000, 75000]}
        max={100000}
      />,
    );
    for (const thumb of [min, max]) {
      await expect.element(thumb).toHaveAttribute("aria-invalid", "true");
      await expect
        .element(thumb)
        .toHaveAccessibleDescription("Choose a range of at least ₹10,000.");
    }
    expect(container.querySelector("[data-slot=field-description]")).toBeNull();
  });

  it("keeps its value when an error arrives later: the slider isn't remounted", async () => {
    const { rerender } = await render(<Slider label="Seats" name="seats" defaultValue={10} />);
    const thumb = page.getByRole("slider", { name: "Seats" });
    thumb.element().focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(thumb).toHaveAttribute("aria-valuenow", "11");
    await rerender(
      <Slider label="Seats" name="seats" defaultValue={10} error="Choose at most 10 seats." />,
    );
    await expect.element(thumb).toHaveAccessibleDescription("Choose at most 10 seats.");
    await expect.element(thumb).toHaveAttribute("aria-valuenow", "11");
    await expect.element(thumb).toHaveFocus();
  });

  it("inside a Field, takes the Field's label and messages and adds no field of its own", async () => {
    const { container } = await render(
      <Field label="Discount" description="Applied before tax.">
        <Slider defaultValue={10} />
      </Field>,
    );
    await expect
      .element(page.getByRole("slider", { name: "Discount" }))
      .toHaveAccessibleDescription("Applied before tax.");
    expect(container.querySelector("[data-slot=slider-field]")).toBeNull();
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
          <Slider
            label="Approval threshold"
            showValue
            description="Invoices above this need a second approval."
            defaultValue={50000}
            max={100000}
            step={5000}
            format={{ style: "currency", currency: "INR", maximumFractionDigits: 0 }}
          />
          <Slider
            label="Session length"
            showValue
            error="Choose at least 15 minutes."
            defaultValue={5}
            max={120}
          />
        </Stack>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Slider");
  });
});
