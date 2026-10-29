import { useState } from "react";
import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { Field } from "../../field/field";
import { ColorField, ColorSwatchGroup, contrastRatio, toHexColor } from "./color";

const iconColours = [
  { value: "--qx-color-icon-default", label: "Default" },
  { value: "--qx-color-icon-brand", label: "Brand" },
  { value: "--qx-color-icon-danger", label: "Danger" },
];
const presets = [
  { value: "#F97316", label: "Orange" },
  { value: "#3B82F6", label: "Blue" },
];

function Brand({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <Field label="Brand colour">
      <ColorField
        value={value}
        onValueChange={setValue}
        suggestions={presets}
        resetLabel="Use Qeet Ember"
        contrast={{ against: "#FFFFFF", label: "the sign-in card" }}
        placeholder="Qeet Ember"
      />
    </Field>
  );
}

describe("colour helpers", () => {
  it("reads hex colours and measures contrast as WCAG does", () => {
    expect(toHexColor("f73")).toBe("#FF7733");
    expect(toHexColor(" #3b82f6 ")).toBe("#3B82F6");
    expect(toHexColor("orange")).toBeNull();
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBe(1);
  });
});

describe("ColorSwatchGroup", () => {
  it("is a radio group of named swatches, each in its colour, the chosen one ringed", async () => {
    await render(
      <ColorSwatchGroup
        aria-label="Icon colour"
        options={iconColours}
        defaultValue="--qx-color-icon-brand"
      />,
    );
    await expect.element(page.getByRole("radiogroup", { name: "Icon colour" })).toBeVisible();
    const brand = page.getByRole("radio", { name: "Brand" });
    await expect.element(brand).toBeChecked();
    expect(getComputedStyle(brand.element()).backgroundColor).toBe(
      tokenColor("--qx-color-icon-brand"),
    );
    expect(getComputedStyle(brand.element()).outlineStyle).toBe("solid");
    const danger = page.getByRole("radio", { name: "Danger" }).element();
    expect(getComputedStyle(danger).outlineStyle).toBe("none");
  });

  it("moves and chooses with the arrow keys, one Tab stop", async () => {
    let chosen = "";
    await render(
      <ColorSwatchGroup
        aria-label="Icon colour"
        options={iconColours}
        defaultValue="--qx-color-icon-default"
        onValueChange={(value) => (chosen = value)}
      />,
    );
    await userEvent.keyboard("{Tab}");
    await expect.element(page.getByRole("radio", { name: "Default" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(page.getByRole("radio", { name: "Brand" })).toBeChecked();
    expect(chosen).toBe("--qx-color-icon-brand");
  });
});

describe("ColorField", () => {
  it("is labelled by its Field; its swatch is the system picker and follows what's typed", async () => {
    const { container } = await render(<Brand />);
    const box = page.getByRole("textbox", { name: "Brand colour" });
    await userEvent.fill(box, "#3b82f6");
    const swatch = container.querySelector("[data-slot=color-field-swatch]") as HTMLElement;
    expect(getComputedStyle(swatch).backgroundColor).toBe("rgb(59, 130, 246)");
    const picker = page.getByLabelText("Pick a colour").element() as HTMLInputElement;
    expect(picker.type).toBe("color");
    expect(picker.value).toBe("#3b82f6");
    await expect.element(page.getByRole("radio", { name: "Blue" })).toBeChecked();
  });

  it("follows the typing with a contrast line that warns under 4.5:1", async () => {
    await render(<Brand />);
    const box = page.getByRole("textbox", { name: "Brand colour" });
    await userEvent.fill(box, "#F97316");
    const low = page.getByText("2.8:1 contrast on the sign-in card: under 4.5:1, hard to read");
    await expect.element(low).toBeVisible();
    expect(getComputedStyle(low.element()).color).toBe(tokenColor("--qx-color-text-warning"));
    await userEvent.fill(box, "#1D4ED8");
    await expect.element(page.getByText("6.7:1 contrast on the sign-in card")).toBeVisible();
  });

  it("takes a suggestion and resets to the default", async () => {
    await render(<Brand initial="#123456" />);
    await userEvent.click(page.getByRole("radio", { name: "Orange" }));
    await expect
      .element(page.getByRole("textbox", { name: "Brand colour" }))
      .toHaveValue("#F97316");
    await userEvent.click(page.getByRole("button", { name: "Use Qeet Ember" }));
    await expect.element(page.getByRole("textbox", { name: "Brand colour" })).toHaveValue("");
    await expect.element(page.getByRole("button", { name: "Use Qeet Ember" })).toBeDisabled();
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <div style={{ display: "grid", gap: 24, inlineSize: 360 }}>
          <ColorSwatchGroup
            aria-label="Icon colour"
            options={iconColours}
            defaultValue="--qx-color-icon-brand"
          />
          <Brand initial="#F97316" />
        </div>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Color");
  });
});
