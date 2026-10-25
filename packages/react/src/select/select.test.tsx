import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
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
