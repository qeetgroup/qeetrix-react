import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { RangeCalendar } from "./range-calendar";

const TODAY = "2026-10-25"; // a Sunday
const day = (iso: string) => document.querySelector(`[data-date="${iso}"]`) as HTMLButtonElement;
const cell = (iso: string) => day(iso).parentElement as HTMLTableCellElement;
const part = (iso: string) => cell(iso).dataset.range ?? (cell(iso).ariaSelected ? "single" : "");
// The range's announcements, not the month title (also a live region).
const live = () => document.querySelector(".qx-range-calendar > [aria-live]")?.textContent;
const full = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));

describe("RangeCalendar", () => {
  it("picks a start, then an end, and selects every day between", async () => {
    const onValueChange = vi.fn();
    await render(<RangeCalendar today={TODAY} onValueChange={onValueChange} />);
    await userEvent.click(day("2026-10-12"));
    expect(onValueChange).not.toHaveBeenCalled();
    await userEvent.click(day("2026-10-15"));
    expect(onValueChange).toHaveBeenCalledWith({ start: "2026-10-12", end: "2026-10-15" });
    expect(["11", "12", "13", "14", "15", "16"].map((d) => part(`2026-10-${d}`))).toEqual([
      "",
      "start",
      "middle",
      "middle",
      "end",
      "",
    ]);
    expect(cell("2026-10-13").getAttribute("aria-selected")).toBe("true");
  });

  it("previews the range to the day under the pointer or focus before the second pick", async () => {
    await render(
      <RangeCalendar today={TODAY} defaultValue={{ start: "2026-10-01", end: "2026-10-02" }} />,
    );
    await userEvent.click(day("2026-10-12"));
    await userEvent.hover(day("2026-10-14"));
    expect(part("2026-10-13")).toBe("middle");
    expect(part("2026-10-14")).toBe("end");
    // The old range is gone while the new one is being chosen.
    expect(part("2026-10-01")).toBe("");
    day("2026-10-12").focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(part("2026-10-19")).toBe("end");
    expect(part("2026-10-16")).toBe("middle");
    await userEvent.keyboard("{Enter}");
    expect(part("2026-10-12")).toBe("start");
    expect(part("2026-10-19")).toBe("end");
  });

  it("swaps ends picked backwards, and makes a one-day range of the same day twice", async () => {
    const onValueChange = vi.fn();
    await render(<RangeCalendar today={TODAY} onValueChange={onValueChange} />);
    await userEvent.click(day("2026-10-20"));
    await userEvent.click(day("2026-10-06"));
    expect(onValueChange).toHaveBeenLastCalledWith({ start: "2026-10-06", end: "2026-10-20" });
    await userEvent.click(day("2026-10-09"));
    await userEvent.click(day("2026-10-09"));
    expect(onValueChange).toHaveBeenLastCalledWith({ start: "2026-10-09", end: "2026-10-09" });
    expect(part("2026-10-09")).toBe("single");
  });

  it("announces each step, and Escape undoes a half-chosen range", async () => {
    const onKeyDown = vi.fn();
    await render(
      // biome-ignore lint/a11y/noStaticElementInteractions: stands in for a popover, listening for the Escape the calendar lets through
      <div onKeyDown={onKeyDown}>
        <RangeCalendar today={TODAY} defaultValue={{ start: "2026-10-01", end: "2026-10-03" }} />
      </div>,
    );
    await userEvent.click(day("2026-10-12"));
    expect(live()).toBe(`Starts ${full("2026-10-12")}. Now choose the end date.`);
    await userEvent.keyboard("{Escape}");
    expect(live()).toBe("");
    expect(part("2026-10-12")).toBe("");
    expect(part("2026-10-02")).toBe("middle");
    // That Escape was the calendar's: a popover around it stays open.
    expect(onKeyDown).not.toHaveBeenCalled();

    await userEvent.click(day("2026-10-12"));
    await userEvent.click(day("2026-10-14"));
    expect(live()).toBe(`${full("2026-10-12")} to ${full("2026-10-14")}`);
    await userEvent.keyboard("{Escape}");
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it("runs across months, and keeps disabled days from being an end", async () => {
    const onValueChange = vi.fn();
    await render(
      <RangeCalendar
        today={TODAY}
        isDateDisabled={(date) => date === "2026-11-03"}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(day("2026-10-28"));
    await page.getByRole("button", { name: "Next month" }).click();
    await userEvent.click(day("2026-11-03"), { force: true });
    expect(onValueChange).not.toHaveBeenCalled();
    await userEvent.click(day("2026-11-04"));
    expect(onValueChange).toHaveBeenCalledWith({ start: "2026-10-28", end: "2026-11-04" });
    expect(part("2026-11-01")).toBe("middle");
  });

  it("keeps a disabled day inside the range grey, untinted on hover, and never previews to it", async () => {
    await render(
      <RangeCalendar
        today={TODAY}
        isDateDisabled={(date) => date === "2026-10-14"}
        defaultValue={{ start: "2026-10-12", end: "2026-10-16" }}
      />,
    );
    // It may fall inside a range, but it reads as unavailable, like any disabled day.
    expect(part("2026-10-14")).toBe("middle");
    expect(getComputedStyle(day("2026-10-14")).color).toBe(tokenColor("--qx-color-text-disabled"));
    expect(getComputedStyle(day("2026-10-13")).color).toBe(tokenColor("--qx-color-text-default"));
    await userEvent.hover(day("2026-10-14"), { force: true });
    expect(getComputedStyle(day("2026-10-14")).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(day("2026-10-14")).cursor).toBe("not-allowed");

    // While the second end is chosen, the range runs only to days that can end it.
    await userEvent.click(day("2026-10-20"));
    await userEvent.hover(day("2026-10-15"));
    expect(part("2026-10-15")).toBe("start");
    await userEvent.hover(day("2026-10-14"), { force: true });
    expect(part("2026-10-15")).toBe("start");
    expect(part("2026-10-14")).toBe("");
    day("2026-10-15").focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(part("2026-10-15")).toBe("start");
    await userEvent.keyboard("{ArrowLeft}");
    expect(part("2026-10-13")).toBe("start");
    expect(part("2026-10-14")).toBe("middle");
  });

  it("can be disabled or read-only, like Calendar: no range is started", async () => {
    const onValueChange = vi.fn();
    const { rerender } = await render(
      <RangeCalendar today={TODAY} disabled onValueChange={onValueChange} />,
    );
    await userEvent.click(day("2026-10-12"), { force: true });
    await userEvent.click(day("2026-10-15"), { force: true });
    expect(part("2026-10-12")).toBe("");
    expect(live()).toBe("");
    await rerender(
      <RangeCalendar key="read-only" today={TODAY} readOnly onValueChange={onValueChange} />,
    );
    await userEvent.click(day("2026-10-12"));
    await userEvent.hover(day("2026-10-15"));
    await userEvent.click(day("2026-10-15"));
    expect(part("2026-10-13")).toBe("");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("has its own data-slot on the root", async () => {
    const { container } = await render(<RangeCalendar today={TODAY} />);
    expect((container.firstElementChild as HTMLElement).dataset.slot).toBe("range-calendar");
    expect(container.querySelector("[data-slot=calendar-grid]")).not.toBeNull();
  });

  it("speaks Hindi through QeetrixProvider", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <RangeCalendar today={TODAY} />
      </QeetrixProvider>,
    );
    await userEvent.click(day("2026-10-12"));
    expect(live()).toMatch(/से शुरू। अब अंतिम तारीख़ चुनें।$/);
  });

  it("is accessible and looks right in both colour schemes", async () => {
    const { container } = await render(
      <Stage>
        {/* A holiday inside the range stays grey. */}
        <RangeCalendar
          today={TODAY}
          isDateDisabled={(date) => date === "2026-10-19"}
          defaultValue={{ start: "2026-10-12", end: "2026-10-27" }}
        />
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("RangeCalendar", "[data-qx-stage]");
  });
});
