import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Input } from "../input/input";
import { Stack } from "../stack/stack";
import { Field } from "./field";

describe("Field", () => {
  it("names the control by its label and describes it with the help text", async () => {
    await render(
      <Field label="GSTIN" description="15 characters.">
        <Input />
      </Field>,
    );
    const input = page.getByRole("textbox", { name: "GSTIN" });
    await expect.element(input).toHaveAccessibleDescription("15 characters.");
  });

  it("marks optional fields, never required ones", async () => {
    const { container } = await render(
      <Field label="Trade name" optional>
        <Input />
      </Field>,
    );
    await expect
      .element(page.getByRole("textbox", { name: "Trade name (optional)" }))
      .toBeVisible();
    expect(container.textContent).not.toContain("*");
  });

  it("shows an error in place of the help text and marks the control invalid", async () => {
    const { container } = await render(
      <Field label="PAN" description="10 characters." error="PAN has 10 characters.">
        <Input defaultValue="ABCDE12" />
      </Field>,
    );
    const input = page.getByRole("textbox", { name: "PAN" });
    await expect.element(input).toHaveAttribute("aria-invalid", "true");
    const error = container.querySelector("[data-slot=field-error]") as HTMLElement;
    expect(error.textContent).toBe("PAN has 10 characters.");
    expect(error.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    const description = container.querySelector("[data-slot=field-description]") as HTMLElement;
    expect(getComputedStyle(description).display).toBe("none");
  });

  it("shows the browser's message when validation fails", async () => {
    const { container } = await render(
      <Field label="Work email" validationMode="onBlur">
        <Input type="email" required />
      </Field>,
    );
    await userEvent.click(page.getByRole("textbox", { name: "Work email" }));
    await userEvent.keyboard("priya");
    await userEvent.keyboard("{Tab}");
    await expect
      .element(page.getByRole("textbox", { name: "Work email" }))
      .toHaveAttribute("aria-invalid", "true");
    const error = container.querySelector("[data-slot=field-error]") as HTMLElement;
    expect(error.textContent?.length).toBeGreaterThan(0);
  });

  it("can hide its label visually and keep the name", async () => {
    const { container } = await render(
      <Field label="Search invoices" hideLabel>
        <Input />
      </Field>,
    );
    await expect.element(page.getByRole("textbox", { name: "Search invoices" })).toBeVisible();
    const label = container.querySelector("[data-slot=field-label]") as HTMLElement;
    expect(label.getBoundingClientRect().width).toBe(1);
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <Stack gap="lg" style={{ inlineSize: 280 }}>
          <Field label="Trade name" optional description="As registered with the MCA.">
            <Input placeholder="e.g. Acme Pvt Ltd" />
          </Field>
          <Field label="PAN" error="PAN has 10 characters.">
            <Input defaultValue="ABCDE12" />
          </Field>
          <Field label="Legacy code" disabled description="Disabled.">
            <Input defaultValue="LGC-0042" />
          </Field>
        </Stack>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Field");
  });
});
