import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { Field } from "../../field/field";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { NumberField } from "./number-field";

const input = (name: string) => page.getByRole("textbox", { name });

describe("NumberField", () => {
  it("is named by its field, and says it's a number field", async () => {
    await render(
      <Field label="Session timeout">
        <NumberField defaultValue={30} endAdornment="minutes" />
      </Field>,
    );
    await expect.element(input("Session timeout")).toHaveValue("30");
    await expect
      .element(input("Session timeout"))
      .toHaveAttribute("aria-roledescription", "Number field");
    await expect.element(page.getByText("minutes")).toBeVisible();
  });

  it("steps with its buttons and stops at min and max", async () => {
    const onValueChange = vi.fn();
    await render(
      <Field label="Seats">
        <NumberField defaultValue={2} min={1} max={3} onValueChange={onValueChange} />
      </Field>,
    );
    await page.getByRole("button", { name: "Increase" }).click();
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBe(3);
    await expect
      .element(page.getByRole("button", { name: "Increase" }))
      .toHaveAttribute("data-disabled", "");
    await page.getByRole("button", { name: "Decrease" }).click();
    await page.getByRole("button", { name: "Decrease" }).click();
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBe(1);
    await expect
      .element(page.getByRole("button", { name: "Decrease" }))
      .toHaveAttribute("data-disabled", "");
  });

  it("steps with the arrow keys, ten at a time with Shift", async () => {
    const onValueChange = vi.fn();
    await render(
      <Field label="Seats">
        <NumberField defaultValue={20} onValueChange={onValueChange} />
      </Field>,
    );
    await input("Seats").click();
    await userEvent.keyboard("{ArrowUp}");
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBe(21);
    await userEvent.keyboard("{Shift>}{ArrowDown}{/Shift}");
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBe(11);
  });

  it("formats for the locale: lakh grouping by default, currency on request", async () => {
    await render(
      <>
        <Field label="Users">
          <NumberField defaultValue={128400} />
        </Field>
        <Field label="Monthly fee">
          <NumberField
            defaultValue={124500}
            format={{ style: "currency", currency: "INR" }}
            steppers={false}
          />
        </Field>
      </>,
    );
    await expect.element(input("Users")).toHaveValue("1,28,400");
    await expect.element(input("Monthly fee")).toHaveValue("₹1,24,500.00");
    expect(page.getByRole("button", { name: "Increase" }).elements()).toHaveLength(1);
  });

  it("can be disabled", async () => {
    await render(
      <Field label="Seats" disabled>
        <NumberField defaultValue={2} disabled />
      </Field>,
    );
    await expect.element(input("Seats")).toBeDisabled();
  });

  it("speaks Hindi through QeetrixProvider", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <NumberField aria-label="सीटें" defaultValue={5} />
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("button", { name: "बढ़ाएँ" })).toBeVisible();
    await expect.element(input("सीटें")).toHaveAttribute("aria-roledescription", "संख्या फ़ील्ड");
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(760, 220);
    const { container } = await render(
      <div
        data-qx-stage=""
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          padding: 16,
          inlineSize: 720,
          background: "var(--qx-color-surface-canvas)",
        }}
      >
        <Field label="Session timeout">
          <NumberField defaultValue={30} min={5} max={1440} endAdornment="minutes" />
        </Field>
        <Field label="Monthly fee">
          <NumberField
            defaultValue={124500}
            format={{ style: "currency", currency: "INR", maximumFractionDigits: 0 }}
            steppers={false}
          />
        </Field>
      </div>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("NumberField", "[data-qx-stage]");
  });
});
