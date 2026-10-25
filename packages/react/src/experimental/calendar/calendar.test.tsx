import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { Calendar } from "./calendar";

const TODAY = "2026-10-25"; // a Sunday
const full = (iso: string, locale = "en-IN") =>
  new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
const day = (iso: string) => document.querySelector(`[data-date="${iso}"]`) as HTMLButtonElement;
const title = () => document.querySelector("[data-slot=calendar-title]")?.textContent;
const focusedDate = () => (document.activeElement as HTMLElement | null)?.dataset.date;
const focused = (key: "year" | "month") =>
  (document.activeElement as HTMLElement | null)?.dataset[key];
const decade = (start: number) =>
  new Intl.DateTimeFormat("en-IN", { year: "numeric", timeZone: "UTC" }).formatRange(
    new Date(Date.UTC(start, 0, 1)),
    new Date(Date.UTC(start + 9, 0, 1)),
  );

describe("Calendar", () => {
  it("is a grid labelled by its month, with full weekday names, starting Sunday in India", async () => {
    const { container } = await render(<Calendar today={TODAY} />);
    await expect.element(page.getByRole("grid", { name: "October 2026" })).toBeVisible();
    const headers = [...container.querySelectorAll("th")].map((th) => th.getAttribute("abbr"));
    expect(headers[0]).toBe("Sunday");
    expect(headers).toHaveLength(7);
  });

  it("starts the week on Monday where the locale does", async () => {
    const { container } = await render(<Calendar today={TODAY} locale="en-GB" />);
    expect(container.querySelector("th")?.getAttribute("abbr")).toBe("Monday");
  });

  it("reads each day as its full date, marks today, and has one day in the Tab order", async () => {
    const { container } = await render(<Calendar today={TODAY} />);
    expect(day("2026-10-12").getAttribute("aria-label")).toBe(full("2026-10-12"));
    expect(day(TODAY).getAttribute("aria-label")).toBe(`Today, ${full(TODAY)}`);
    expect(container.querySelectorAll('button[tabindex="0"][data-date]')).toHaveLength(1);
    expect(day(TODAY).tabIndex).toBe(0);
  });

  it("keeps the same height for a four-week and a six-week month", async () => {
    const { rerender } = await render(<Calendar today={TODAY} defaultMonth="2026-02" />);
    const height = () =>
      document.querySelector(".qx-calendar-grid")?.getBoundingClientRect().height;
    const february = height(); // 2026-02 fills exactly four weeks from Sunday
    await rerender(<Calendar key="august" today={TODAY} defaultMonth="2026-08" />);
    expect(title()).toBe("August 2026"); // six weeks
    expect(height()).toBe(february);
  });

  it("moves by day and week, to the week's ends, by month and by year", async () => {
    await render(<Calendar today={TODAY} />);
    day(TODAY).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(focusedDate()).toBe("2026-10-26");
    await userEvent.keyboard("{ArrowDown}");
    expect(focusedDate()).toBe("2026-11-02");
    expect(title()).toBe("November 2026");
    await userEvent.keyboard("{End}");
    expect(focusedDate()).toBe("2026-11-07");
    await userEvent.keyboard("{Home}");
    expect(focusedDate()).toBe("2026-11-01");
    await userEvent.keyboard("{PageUp}");
    expect(focusedDate()).toBe("2026-10-01");
    await userEvent.keyboard("{Shift>}{PageDown}{/Shift}");
    expect(focusedDate()).toBe("2027-10-01");
    await userEvent.keyboard("{ArrowUp}{ArrowLeft}");
    expect(focusedDate()).toBe("2027-09-23");
  });

  it("keeps the day number across months, or takes the month's last day", async () => {
    await render(<Calendar today={TODAY} defaultValue="2026-01-31" />);
    day("2026-01-31").focus();
    await userEvent.keyboard("{PageDown}");
    expect(focusedDate()).toBe("2026-02-28");
  });

  it("chooses a day by click or by Enter", async () => {
    const onValueChange = vi.fn();
    const { container } = await render(<Calendar today={TODAY} onValueChange={onValueChange} />);
    day("2026-10-12").click();
    expect(onValueChange).toHaveBeenLastCalledWith("2026-10-12");
    await expect
      .poll(() => day("2026-10-12").closest("td")?.getAttribute("aria-selected"))
      .toBe("true");
    expect(container.querySelectorAll('[aria-selected="true"]')).toHaveLength(1);
    day("2026-10-12").focus();
    await userEvent.keyboard("{ArrowRight}{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("2026-10-13");
  });

  it("keeps out of range and disabled days unchosen, and stops navigation at the limits", async () => {
    const onValueChange = vi.fn();
    await render(
      <Calendar
        today={TODAY}
        min="2026-10-10"
        max="2026-10-28"
        isDateDisabled={(iso) => iso === "2026-10-20"}
        onValueChange={onValueChange}
      />,
    );
    expect(day("2026-10-09").getAttribute("aria-disabled")).toBe("true");
    expect(day("2026-10-20").getAttribute("aria-disabled")).toBe("true");
    day("2026-10-20").click();
    expect(onValueChange).not.toHaveBeenCalled();
    await expect
      .element(page.getByRole("button", { name: "Previous month" }))
      .toHaveAttribute("aria-disabled", "true");
    day("2026-10-27").focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(focusedDate()).toBe("2026-10-28");
  });

  it("opens the years from its title, a decade a page; a year opens its months, a month its days", async () => {
    await render(<Calendar today={TODAY} defaultValue="2026-10-20" />);
    await page.getByRole("button", { name: "October 2026, choose year" }).click();
    expect(title()).toBe(decade(2020));
    expect(focused("year")).toBe("2026");
    expect(document.querySelector('[data-year="2026"]')?.getAttribute("aria-current")).toBe("date");
    await page.getByRole("button", { name: "Previous 10 years" }).click();
    expect(title()).toBe(decade(2010));
    await page.getByRole("button", { name: "2016", exact: true }).click();
    expect(title()).toBe("2016");
    expect(focused("month")).toBe("2016-10");
    await page.getByRole("button", { name: "Mar", exact: true }).click();
    expect(title()).toBe("March 2016");
    expect(focusedDate()).toBe("2016-03-20");
  });

  it("moves through years and months by keyboard, and Escape goes back to the days", async () => {
    await render(<Calendar today={TODAY} defaultValue="2026-10-20" />);
    await page.getByRole("button", { name: "October 2026, choose year" }).click();
    await userEvent.keyboard("{ArrowLeft}");
    expect(focused("year")).toBe("2025");
    await userEvent.keyboard("{ArrowUp}");
    expect(focused("year")).toBe("2022");
    await userEvent.keyboard("{PageUp}");
    expect(focused("year")).toBe("2012");
    expect(title()).toBe(decade(2010));
    await userEvent.keyboard("{Enter}");
    expect(focused("month")).toBe("2012-10");
    await userEvent.keyboard("{ArrowRight}{End}");
    expect(focused("month")).toBe("2012-12");
    await userEvent.keyboard("{Home}{ArrowUp}");
    expect(focused("month")).toBe("2012-07");
    await userEvent.keyboard("{Enter}");
    expect(focusedDate()).toBe("2012-07-20");

    await page.getByRole("button", { name: "July 2012, choose year" }).click();
    expect(focused("year")).toBe("2012");
    await userEvent.keyboard("{Escape}");
    expect(title()).toBe("July 2012");
    expect(focusedDate()).toBe("2012-07-20");
  });

  it("keeps years and months outside the range out of reach", async () => {
    await render(<Calendar today={TODAY} min="2024-03-15" max="2027-08-01" />);
    await page.getByRole("button", { name: "October 2026, choose year" }).click();
    const year = (y: number) => document.querySelector(`[data-year="${y}"]`);
    expect(year(2023)?.getAttribute("aria-disabled")).toBe("true");
    expect(year(2024)?.hasAttribute("aria-disabled")).toBe(false);
    expect(year(2028)?.getAttribute("aria-disabled")).toBe("true");
    await expect
      .element(page.getByRole("button", { name: "Previous 10 years" }))
      .toHaveAttribute("aria-disabled", "true");
    await expect
      .element(page.getByRole("button", { name: "Next 10 years" }))
      .toHaveAttribute("aria-disabled", "true");
    await page.getByRole("button", { name: "2024", exact: true }).click();
    const month = (m: string) => document.querySelector(`[data-month="${m}"]`);
    expect(month("2024-02")?.getAttribute("aria-disabled")).toBe("true");
    expect(month("2024-03")?.hasAttribute("aria-disabled")).toBe(false);
    await expect
      .element(page.getByRole("button", { name: "Previous year" }))
      .toHaveAttribute("aria-disabled", "true");
  });

  it("keeps the same size in every view", async () => {
    await render(<Calendar today={TODAY} />);
    const size = () => {
      const box = document.querySelector("[data-slot=calendar]")?.getBoundingClientRect();
      return [box?.width, box?.height];
    };
    const days = size();
    await page.getByRole("button", { name: "October 2026, choose year" }).click();
    expect(size()).toEqual(days);
    await page.getByRole("button", { name: "2026", exact: true }).click();
    expect(size()).toEqual(days);
  });

  it("mirrors the arrow keys right-to-left", async () => {
    await render(
      <QeetrixProvider direction="rtl">
        <Calendar today={TODAY} />
      </QeetrixProvider>,
    );
    day(TODAY).focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(focusedDate()).toBe("2026-10-26");
  });

  it("speaks Hindi through QeetrixProvider", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <Calendar today={TODAY} />
      </QeetrixProvider>,
    );
    // Browsers ship different Hindi spellings (WebKit: अक्तूबर); the title is the browser's own.
    const month = new Intl.DateTimeFormat("hi-IN", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    expect(title()).toBe(month.format(new Date("2026-10-01T00:00:00Z")));
    expect(title()).toMatch(/^अक्.ूबर 2026$/);
    expect(day(TODAY).getAttribute("aria-label")).toBe(`आज, ${full(TODAY, "hi-IN")}`);
    await expect.element(page.getByRole("button", { name: "पिछला महीना" })).toBeVisible();
    await expect.element(page.getByRole("button", { name: `${title()}, साल चुनें` })).toBeVisible();
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <Calendar today={TODAY} defaultValue="2026-10-14" min="2026-10-03" />
      </Stage>,
    );
    day("2026-10-21").focus();
    await expectAccessible(container);
    await screenshotEveryMode("Calendar", "[data-qx-stage]");
    await page.getByRole("button", { name: "October 2026, choose year" }).click();
    await expectAccessible(container);
    await screenshotEveryMode("Calendar · years", "[data-qx-stage]");
    await page.getByRole("button", { name: "2026", exact: true }).click();
    await expectAccessible(container);
    await screenshotEveryMode("Calendar · months", "[data-qx-stage]");
  });
});
