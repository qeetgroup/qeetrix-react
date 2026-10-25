import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { TextField } from "../text-field/text-field";
import { Fieldset } from "./fieldset";

const html = document.documentElement;

describe("Fieldset", () => {
  it("names the section by its legend and disables every field inside", async () => {
    await render(
      <Fieldset legend="Billing address" disabled>
        <TextField label="City" />
      </Fieldset>,
    );
    await expect.element(page.getByRole("group", { name: "Billing address" })).toBeVisible();
    await expect.element(page.getByRole("textbox", { name: "City" })).toBeDisabled();
  });

  it("describes the group by its description, alongside any description of the caller's", async () => {
    const { rerender } = await render(
      <Fieldset legend="Billing address" description="Where invoices are sent.">
        <TextField label="City" />
      </Fieldset>,
    );
    const group = page.getByRole("group", { name: "Billing address" });
    await expect.element(group).toHaveAccessibleDescription("Where invoices are sent.");
    await rerender(
      <>
        <p id="gst-note">Must match your GST registration.</p>
        <Fieldset
          legend="Billing address"
          description="Where invoices are sent."
          aria-describedby="gst-note"
        >
          <TextField label="City" />
        </Fieldset>
      </>,
    );
    await expect
      .element(group)
      .toHaveAccessibleDescription("Must match your GST registration. Where invoices are sent.");
    await rerender(
      <Fieldset legend="Billing address">
        <TextField label="City" />
      </Fieldset>,
    );
    await expect.element(group).not.toHaveAttribute("aria-describedby");
  });

  it("spaces fields by the density's form gap: 12, 16 and 20px", async () => {
    const { container } = await render(
      <Fieldset legend="Company">
        <TextField label="Trade name" />
        <TextField label="GSTIN" />
      </Fieldset>,
    );
    const fieldset = container.querySelector("[data-slot=fieldset]") as HTMLElement;
    const gaps: Record<string, string> = {};
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      gaps[density] = getComputedStyle(fieldset).rowGap;
    }
    delete html.dataset.qxDensity;
    expect(gaps).toEqual({ compact: "12px", default: "16px", comfortable: "20px" });
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <Fieldset
          legend="Company"
          description="As registered with the MCA."
          style={{ inlineSize: 280 }}
        >
          <TextField label="Trade name" optional />
          <TextField label="GSTIN" defaultValue="29ABCDE1234F1Z5" />
        </Fieldset>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("Fieldset");
  });
});
