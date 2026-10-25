import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { Field } from "../../field/field";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { DateRangePicker } from "./date-range-picker";

const TODAY = "2026-10-25"; // a Sunday
const field = (name = "Audit period") => page.getByRole("textbox", { name });
const textbox = () => document.querySelector("[data-slot=input-control]") as HTMLInputElement;
const day = (iso: string) => document.querySelector(`[data-date="${iso}"]`) as HTMLButtonElement;
const focusedDate = () => (document.activeElement as HTMLElement | null)?.dataset.date;

describe("DateRangePicker", () => {
  it("is one text field named by its Field, showing both dates, with a calendar button", async () => {
    await render(
      <Field label="Audit period">
        <DateRangePicker defaultValue={{ start: "2026-10-01", end: "2026-10-25" }} today={TODAY} />
      </Field>,
    );
    await expect.element(field()).toHaveValue("01/10/2026 – 25/10/2026");
    await expect.element(page.getByRole("button", { name: "Choose dates" })).toBeVisible();
  });

  it("shows an example of both dates that can't be misread", async () => {
    await render(<DateRangePicker aria-label="Audit period" today={TODAY} />);
    await expect.element(field()).toHaveAttribute("placeholder", "e.g. 01/12/2026 – 31/12/2026");
  });

  it("reads a typed range on leaving the field or on Enter, in either order", async () => {
    const onValueChange = vi.fn();
    await render(
      <DateRangePicker aria-label="Audit period" today={TODAY} onValueChange={onValueChange} />,
    );
    await userEvent.type(field(), "1-10-26 - 25-10-26");
    expect(onValueChange).not.toHaveBeenCalled();
    await userEvent.tab();
    expect(onValueChange).toHaveBeenLastCalledWith({ start: "2026-10-01", end: "2026-10-25" });
    await expect.element(field()).toHaveValue("01/10/2026 – 25/10/2026");

    await userEvent.clear(field());
    await userEvent.type(field(), "31.10.2026 20.10.2026{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith({ start: "2026-10-20", end: "2026-10-31" });
    await expect.element(field()).toHaveValue("20/10/2026 – 31/10/2026");
  });

  it("keeps text that isn't an allowed range, and says why through the Field", async () => {
    await render(
      <Field label="Audit period" validationMode="onBlur">
        <DateRangePicker
          min="2026-01-01"
          max={TODAY}
          isDateDisabled={(date) => date === "2026-10-02"}
          today={TODAY}
        />
      </Field>,
    );
    const cases = [
      ["01/10/2026", "Enter dates like 01/12/2026 – 31/12/2026"],
      ["01/12/2025 – 05/01/2026", "Choose 01/01/2026 or later"],
      ["01/10/2026 – 30/10/2026", "Choose 25/10/2026 or earlier"],
      ["02/10/2026 – 05/10/2026", "02/10/2026 isn't available"],
    ];
    for (const [typed, message] of cases) {
      await userEvent.clear(field());
      await userEvent.type(field(), typed as string);
      await userEvent.tab();
      await expect.element(field()).toHaveValue(typed as string);
      await expect.element(field()).toHaveAttribute("aria-invalid", "true");
      await expect.element(page.getByText(message as string)).toBeVisible();
    }
    await userEvent.clear(field());
    await userEvent.type(field(), "03/10/2026 – 05/10/2026");
    await userEvent.tab();
    await expect.element(field()).not.toHaveAttribute("aria-invalid");
    expect(textbox().validity.valid).toBe(true);
  });

  it("picks both ends in the calendar, then closes and returns focus", async () => {
    await render(
      <Field label="Audit period">
        <DateRangePicker today={TODAY} />
      </Field>,
    );
    const button = page.getByRole("button", { name: "Choose dates" });
    await button.click();
    await expect.element(page.getByRole("dialog", { name: "Choose dates" })).toBeVisible();
    await expect.poll(focusedDate).toBe(TODAY);
    await userEvent.click(day("2026-10-05"));
    await expect.element(page.getByRole("dialog")).toBeVisible();
    await userEvent.click(day("2026-10-09"));
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await expect.element(field()).toHaveValue("05/10/2026 – 09/10/2026");
    await expect.element(button).toHaveFocus();
  });

  it("opens on the range's start; Escape undoes a half-chosen range, then closes", async () => {
    await render(
      <Field label="Audit period">
        <DateRangePicker defaultValue={{ start: "2026-09-14", end: "2026-09-18" }} today={TODAY} />
      </Field>,
    );
    await field().click();
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await expect.poll(focusedDate).toBe("2026-09-14");
    await userEvent.keyboard("{ArrowRight}{Enter}");
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await expect.element(field()).toHaveFocus();
    await expect.element(field()).toHaveValue("14/09/2026 – 18/09/2026");
  });

  it("submits both dates as YYYY-MM-DD through hidden inputs", async () => {
    const { container } = await render(
      <form>
        <DateRangePicker
          aria-label="Audit period"
          startName="from"
          endName="to"
          defaultValue={{ start: "2026-10-01", end: "2026-10-25" }}
        />
      </form>,
    );
    const data = () => new FormData(container.querySelector("form") as HTMLFormElement);
    expect([data().get("from"), data().get("to")]).toEqual(["2026-10-01", "2026-10-25"]);
    await userEvent.clear(field());
    await userEvent.tab();
    expect([data().get("from"), data().get("to")]).toEqual(["", ""]);
  });

  it("speaks Hindi through QeetrixProvider", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <DateRangePicker aria-label="अवधि" today={TODAY} />
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("button", { name: "तारीख़ें चुनें" })).toBeVisible();
    await expect
      .element(field("अवधि"))
      .toHaveAttribute("placeholder", "जैसे 01/12/2026 – 31/12/2026");
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
        <Field label="Audit period" description="Up to today.">
          <DateRangePicker
            defaultValue={{ start: "2026-10-12", end: "2026-10-21" }}
            max={TODAY}
            today={TODAY}
          />
        </Field>
        <Field label="Leave dates" optional>
          <DateRangePicker today={TODAY} />
        </Field>
      </div>,
    );
    await page.getByRole("button", { name: "Choose dates" }).first().click();
    await expect.element(page.getByRole("dialog")).toBeVisible();
    await screenshotEveryMode("DateRangePicker", null);
    await expectAccessible(document.querySelector("[role=dialog]") as HTMLElement);
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await expectAccessible(container);
  });
});
