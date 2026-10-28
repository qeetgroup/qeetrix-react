import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Button } from "../button/button";
import { Field } from "../field/field";
import { Stack } from "../stack/stack";
import { Select } from "./select";

type Cycle = "monthly" | "quarterly" | "yearly";
const CYCLES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly", disabled: true },
] as const satisfies ReadonlyArray<{ value: Cycle; label: string; disabled?: boolean }>;

const html = document.documentElement;
const trigger = () => page.getByRole("combobox", { name: "Billing cycle" });

describe("Select", () => {
  it("is labelled by its Field and shows the placeholder", async () => {
    await render(
      <Field label="Billing cycle">
        <Select<Cycle> items={CYCLES} placeholder="e.g. Monthly" />
      </Field>,
    );
    await expect.element(trigger()).toHaveTextContent("e.g. Monthly");
  });

  it("opens below with the keyboard; Enter chooses and reports the value", async () => {
    const onValueChange = vi.fn();
    await render(
      <Field label="Billing cycle">
        <Select<Cycle> items={CYCLES} defaultValue="monthly" onValueChange={onValueChange} />
      </Field>,
    );
    await trigger().click();
    const listbox = page.getByRole("listbox");
    await expect.element(listbox).toBeVisible();
    const below =
      listbox.element().getBoundingClientRect().top >=
      trigger().element().getBoundingClientRect().bottom;
    expect(below).toBe(true);
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("quarterly", expect.anything());
    await expect.element(trigger()).toHaveTextContent("Quarterly");
    await expect.element(trigger()).toHaveFocus();
  });

  it("shows an option's meta at its end and reads it out, but not in the closed trigger", async () => {
    await render(
      <Field label="Department">
        <Select<string>
          items={[
            { value: "eng", label: "Engineering", meta: 19 },
            { value: "fin", label: "Finance", meta: 4 },
          ]}
          defaultValue="eng"
        />
      </Field>,
    );
    const department = page.getByRole("combobox", { name: "Department" });
    await expect.element(department).toHaveTextContent("Engineering");
    expect(department.element().textContent).not.toContain("19");
    await department.click();
    const option = page.getByRole("option", { name: "Engineering 19" });
    await expect.element(option).toBeVisible();
    const meta = option.element().querySelector("[data-slot=select-option-meta]") as HTMLElement;
    const text = option.element().querySelector(".qx-select-option-text") as HTMLElement;
    expect(meta.getBoundingClientRect().left).toBeGreaterThan(text.getBoundingClientRect().left);
    expect(getComputedStyle(meta).fontVariantNumeric).toBe("tabular-nums");
  });

  it("takes a toolbar's sizes, as tall as Buttons of the same size in every density", async () => {
    await render(
      <div>
        <Select<string> aria-label="Style" size="sm" items={[{ value: "p", label: "Paragraph" }]} />
        <Button size="sm">Bold</Button>
        <Select<string> aria-label="Font" size="md" items={[{ value: "s", label: "Sans" }]} />
        <Button size="md">Italic</Button>
      </div>,
    );
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      const height = (el: Element) => el.getBoundingClientRect().height;
      const style = page.getByRole("combobox", { name: "Style" }).element();
      const font = page.getByRole("combobox", { name: "Font" }).element();
      expect(height(style), density).toBe(
        height(page.getByRole("button", { name: "Bold" }).element()),
      );
      expect(height(font), density).toBe(
        height(page.getByRole("button", { name: "Italic" }).element()),
      );
    }
    delete html.dataset.qxDensity;
  });

  it("marks the chosen option with an Ember check and skips disabled ones", async () => {
    await render(
      <Field label="Billing cycle">
        <Select<Cycle> items={CYCLES} defaultValue="monthly" />
      </Field>,
    );
    await trigger().click();
    const monthly = page.getByRole("option", { name: "Monthly" });
    await expect.element(monthly).toHaveAttribute("aria-selected", "true");
    const check = monthly.element().querySelector(".qx-select-option-check") as HTMLElement;
    expect(getComputedStyle(check).color).toBe(tokenColor("--qx-color-icon-brand"));
    await expect
      .element(page.getByRole("option", { name: "Yearly" }))
      .toHaveAttribute("aria-disabled", "true");
  });

  it("lists every chosen label with multiple", async () => {
    await render(
      <Field label="Billing cycle">
        <Select<Cycle, true> items={CYCLES} multiple defaultValue={["monthly", "quarterly"]} />
      </Field>,
    );
    await expect.element(trigger()).toHaveTextContent("Monthly, Quarterly");
  });

  it("follows the density like a field: 32, 40 and 44px", async () => {
    await render(<Select<Cycle> items={CYCLES} aria-label="Billing cycle" />);
    const heights: Record<string, number> = {};
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      heights[density] = trigger().element().getBoundingClientRect().height;
    }
    delete html.dataset.qxDensity;
    expect(heights).toEqual({ compact: 32, default: 40, comfortable: 44 });
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(360, 360);
    await render(
      <Stage>
        <Stack gap="lg" style={{ inlineSize: 280 }}>
          <Field label="Billing cycle">
            <Select<Cycle>
              items={[{ label: "Recurring", items: CYCLES }]}
              defaultValue="monthly"
              defaultOpen
            />
          </Field>
        </Stack>
      </Stage>,
    );
    await expect.element(page.getByRole("listbox")).toBeVisible();
    await expectAccessible(document.body);
    await screenshotEveryMode("Select", null);
  });
});
