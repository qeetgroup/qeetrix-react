import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { Field } from "../../field/field";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { DatePicker } from "./date-picker";

const TODAY = "2026-10-25"; // a Sunday
const field = (name = "Joining date") => page.getByRole("textbox", { name });
const textbox = () => document.querySelector("[data-slot=input-control]") as HTMLInputElement;
const focusedDate = () => (document.activeElement as HTMLElement | null)?.dataset.date;

/** A controlled picker whose value can also be reset from outside. */
function Controlled() {
  const [value, setValue] = useState<string | null>("2026-10-25");
  return (
    <>
      <DatePicker aria-label="Joining date" value={value} onValueChange={setValue} />
      <button type="button" onClick={() => setValue("2026-12-01")}>
        Reset
      </button>
      <output>{value ?? "none"}</output>
    </>
  );
}

describe("DatePicker", () => {
  it("is a text field named by its Field, in India's date order, with a calendar button", async () => {
    await render(
      <Field label="Joining date">
        <DatePicker defaultValue="2026-10-25" today={TODAY} />
      </Field>,
    );
    await expect.element(field()).toHaveValue("25/10/2026");
    await expect.element(page.getByRole("button", { name: "Choose date" })).toBeVisible();
  });

  it("writes and reads the locale's order, with an example that can't be misread", async () => {
    await render(
      <>
        <DatePicker aria-label="Empty" today={TODAY} />
        <DatePicker aria-label="US" locale="en-US" defaultValue="2026-10-25" today={TODAY} />
      </>,
    );
    await expect.element(field("Empty")).toHaveAttribute("placeholder", "e.g. 31/12/2026");
    await expect.element(field("US")).toHaveValue("10/25/2026");
    await expect.element(field("US")).toHaveAttribute("placeholder", "e.g. 12/31/2026");
  });

  it("reads typed dates on leaving the field or on Enter, with any separator", async () => {
    const onValueChange = vi.fn();
    await render(
      <DatePicker aria-label="Joining date" today={TODAY} onValueChange={onValueChange} />,
    );
    await userEvent.type(field(), "5-3-26");
    expect(onValueChange).not.toHaveBeenCalled();
    await userEvent.tab();
    expect(onValueChange).toHaveBeenLastCalledWith("2026-03-05");
    await expect.element(field()).toHaveValue("05/03/2026");

    await userEvent.clear(field());
    await userEvent.type(field(), "25.10.2026{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("2026-10-25");
    await expect.element(field()).toHaveValue("25/10/2026");

    await userEvent.clear(field());
    await userEvent.tab();
    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it("keeps text that isn't an allowed date, and says why through the Field", async () => {
    const onValueChange = vi.fn();
    await render(
      <Field label="Joining date" validationMode="onBlur">
        <DatePicker
          defaultValue="2026-11-10"
          min="2026-11-01"
          max="2026-12-31"
          isDateDisabled={(date) => date === "2026-11-14"}
          today={TODAY}
          onValueChange={onValueChange}
        />
      </Field>,
    );
    const cases = [
      ["31/02/2026", "Enter a date like 31/12/2026"],
      ["25/10/2026", "Choose 01/11/2026 or later"],
      ["01/01/2027", "Choose 31/12/2026 or earlier"],
      ["14/11/2026", "14/11/2026 isn't available"],
    ];
    for (const [typed, message] of cases) {
      await userEvent.clear(field());
      await userEvent.type(field(), typed as string);
      await userEvent.tab();
      await expect.element(field()).toHaveValue(typed as string);
      await expect.element(field()).toHaveAttribute("aria-invalid", "true");
      await expect.element(page.getByText(message as string)).toBeVisible();
      expect(textbox().validity.valid).toBe(false);
    }
    expect(onValueChange).toHaveBeenCalledWith(null);

    await userEvent.clear(field());
    await userEvent.type(field(), "12/11/2026");
    await userEvent.tab();
    expect(onValueChange).toHaveBeenLastCalledWith("2026-11-12");
    await expect.element(field()).not.toHaveAttribute("aria-invalid");
    expect(textbox().validity.valid).toBe(true);
  });

  it("opens on the chosen date; choosing fills the field, closes, and returns focus", async () => {
    await render(
      <Field label="Joining date">
        <DatePicker defaultValue="2026-10-20" today={TODAY} />
      </Field>,
    );
    const button = page.getByRole("button", { name: "Choose date" });
    await button.click();
    await expect.element(page.getByRole("dialog", { name: "Choose date" })).toBeVisible();
    await expect.poll(focusedDate).toBe("2026-10-20");
    await userEvent.keyboard("{ArrowRight}{Enter}");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await expect.element(field()).toHaveValue("21/10/2026");
    await expect.element(button).toHaveFocus();
  });

  it("opens exactly as wide as its field, and never narrower than the calendar", async () => {
    await page.viewport(760, 520);
    await render(
      <div style={{ display: "grid", gridTemplateColumns: "400px 160px", gap: 24, padding: 16 }}>
        <DatePicker aria-label="Wide" today={TODAY} />
        <DatePicker aria-label="Narrow" today={TODAY} />
      </div>,
    );
    const [wide, narrow] = page.getByRole("button", { name: "Choose date" }).all();
    const edges = (selector: string) => document.querySelector(selector)?.getBoundingClientRect();

    await wide?.click();
    await expect.element(page.getByRole("dialog")).toBeVisible();
    const field = edges(".qx-date-picker");
    const popup = edges("[data-slot=popover-popup]");
    expect(popup?.left).toBe(field?.left);
    expect(popup?.right).toBe(field?.right);
    // The day columns share the width evenly.
    const days = [...document.querySelectorAll(".qx-calendar-day")].map(
      (day) => day.getBoundingClientRect().width,
    );
    expect(Math.max(...days) - Math.min(...days)).toBeLessThan(1);
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();

    await narrow?.click();
    await expect.element(page.getByRole("dialog")).toBeVisible();
    const small = edges("[data-slot=popover-popup]");
    expect(small?.width).toBeGreaterThan(160);
    const day = edges(".qx-calendar-day");
    expect(day?.width).toBe(day?.height);
  });

  it("opens from the field with Alt+Down, and gives focus back to the field", async () => {
    await render(
      <Field label="Joining date">
        <DatePicker today={TODAY} />
      </Field>,
    );
    await field().click();
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await expect.element(page.getByRole("dialog")).toBeVisible();
    await expect.poll(focusedDate).toBe(TODAY);
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await expect.element(field()).toHaveFocus();
    await expect.element(field()).toHaveValue("");

    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await expect.poll(focusedDate).toBe(TODAY);
    await userEvent.keyboard("{ArrowLeft}{Enter}");
    await expect.element(field()).toHaveValue("24/10/2026");
    await expect.element(field()).toHaveFocus();
  });

  it("jumps years inside the calendar; Escape steps back to the days before it closes", async () => {
    await render(
      <Field label="Date of birth">
        <DatePicker today={TODAY} />
      </Field>,
    );
    await page.getByRole("button", { name: "Choose date" }).click();
    await page.getByRole("button", { name: "October 2026, choose year" }).click();
    await page.getByRole("button", { name: "Previous 10 years" }).click();
    await page.getByRole("button", { name: "Previous 10 years" }).click();
    await page.getByRole("button", { name: "Previous 10 years" }).click();
    await page.getByRole("button", { name: "1994", exact: true }).click();
    await page.getByRole("button", { name: "Aug", exact: true }).click();
    await page.getByRole("button", { name: /15 August 1994/ }).click();
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await expect.element(field("Date of birth")).toHaveValue("15/08/1994");

    await page.getByRole("button", { name: "Choose date" }).click();
    await page.getByRole("button", { name: "August 1994, choose year" }).click();
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog")).toBeVisible();
    await expect.poll(focusedDate).toBe("1994-08-15");
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when Tab leaves it, like any popover", async () => {
    await render(
      <Field label="Joining date">
        <DatePicker today={TODAY} />
      </Field>,
    );
    await page.getByRole("button", { name: "Choose date" }).click();
    await expect.poll(focusedDate).toBe(TODAY);
    await userEvent.tab();
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens on the field's month when typed text was a date, and on min when today is before it", async () => {
    // Side by side, so the first button's tooltip can't cover the second.
    await render(
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <DatePicker aria-label="Typed" today={TODAY} />
        <DatePicker aria-label="Later" today={TODAY} min="2027-01-10" />
      </div>,
    );
    await userEvent.type(field("Typed"), "03/02/2026");
    const [typed, later] = page.getByRole("button", { name: "Choose date" }).all();
    await typed?.click();
    await expect.poll(focusedDate).toBe("2026-02-03");
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await later?.click();
    await expect.poll(focusedDate).toBe("2027-01-10");
  });

  it("submits the date as YYYY-MM-DD through a hidden input", async () => {
    const { container } = await render(
      <form>
        <DatePicker aria-label="Joining date" name="joined" defaultValue="2026-10-25" />
      </form>,
    );
    const form = container.querySelector("form") as HTMLFormElement;
    expect(new FormData(form).get("joined")).toBe("2026-10-25");
    await userEvent.clear(field());
    await userEvent.type(field(), "1/11/2026");
    await userEvent.tab();
    expect(new FormData(form).get("joined")).toBe("2026-11-01");
    expect(textbox().name).toBe("");
  });

  it("follows a controlled value, which replaces anything half-typed", async () => {
    await render(<Controlled />);
    await userEvent.clear(field());
    await userEvent.type(field(), "nonsense");
    await userEvent.tab();
    await expect.element(page.getByRole("status")).toHaveTextContent("none");
    await expect.element(field()).toHaveValue("nonsense");
    expect(textbox().validity.valid).toBe(false);
    await page.getByRole("button", { name: "Reset" }).click();
    await expect.element(field()).toHaveValue("01/12/2026");
    await expect.poll(() => textbox().validity.valid).toBe(true);
  });

  it("can be disabled or read-only, and so can its calendar button", async () => {
    await render(
      <>
        <DatePicker aria-label="Disabled" defaultValue="2026-10-25" disabled />
        <DatePicker aria-label="Read-only" defaultValue="2026-10-25" readOnly />
      </>,
    );
    await expect.element(field("Disabled")).toBeDisabled();
    await expect.element(field("Read-only")).toHaveAttribute("readonly");
    for (const button of page.getByRole("button", { name: "Choose date" }).all()) {
      await expect.element(button).toHaveAttribute("aria-disabled", "true");
      await button.click({ force: true });
    }
    expect(document.querySelector("[role=dialog]")).toBeNull();
  });

  it("speaks Hindi through QeetrixProvider", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <DatePicker aria-label="तारीख़" today={TODAY} />
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("button", { name: "तारीख़ चुनें" })).toBeVisible();
    await expect.element(field("तारीख़")).toHaveAttribute("placeholder", "जैसे 31/12/2026");
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(760, 480);
    const { container } = await render(
      <div
        data-qx-stage=""
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          alignItems: "start",
          padding: 16,
          inlineSize: 720,
          blockSize: 440,
          background: "var(--qx-color-surface-canvas)",
        }}
      >
        <Field label="Joining date" description="The first working day.">
          <DatePicker defaultValue="2026-10-20" today={TODAY} />
        </Field>
        <Field label="Last working day" optional>
          <DatePicker today={TODAY} />
        </Field>
      </div>,
    );
    await page.getByRole("button", { name: "Choose date" }).first().click();
    await expect.element(page.getByRole("dialog")).toBeVisible();
    await screenshotEveryMode("DatePicker", null);
    // The open dialog is checked on its own, then the form once it has closed.
    await expectAccessible(document.querySelector("[role=dialog]") as HTMLElement);
    await page.getByRole("button", { name: "October 2026, choose year" }).click();
    await screenshotEveryMode("DatePicker · years", null);
    await expectAccessible(document.querySelector("[role=dialog]") as HTMLElement);
    await userEvent.keyboard("{Escape}");
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await expectAccessible(container);
  });
});
