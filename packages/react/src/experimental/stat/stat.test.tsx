import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stat, StatGroup } from "./stat";

function Strip() {
  return (
    <StatGroup aria-label="Users at a glance">
      <Stat
        label="Total users"
        value={1284}
        note="+38 this week"
        tone="positive"
        trend={[1080, 1110, 1139, 1172, 1205, 1246, 1284]}
      />
      <Stat label="Passkey adoption" value="72%" note="+6 pts this month" tone="positive" />
      <Stat label="Failed sign-ins" value={312} note="Up 40% on last week" tone="negative" />
      <Stat
        label="Pending invitations"
        value={64}
        note="9 expire this week"
        tone="warning"
        trend={[30, 34, 31, 40, 52, 58, 64]}
      />
    </StatGroup>
  );
}

describe("Stat", () => {
  it("is a description list: each label names its value", async () => {
    const { container } = await render(<Strip />);
    const terms = [...container.querySelectorAll("dt")].map((term) => term.textContent);
    expect(terms).toEqual([
      "Total users",
      "Passkey adoption",
      "Failed sign-ins",
      "Pending invitations",
    ]);
    const first = container.querySelector("[data-slot=stat]") as HTMLElement;
    expect(first.querySelector("dd")?.textContent).toBe("1,284");
  });

  it("formats numeric values for the locale and leaves strings alone", async () => {
    await render(
      <StatGroup>
        <Stat label="Collected" value={128400} />
        <Stat label="Collected" value={128400} locale="en-US" />
        <Stat label="Share" value="72%" />
      </StatGroup>,
    );
    await expect.element(page.getByText("1,28,400")).toBeVisible();
    await expect.element(page.getByText("128,400")).toBeVisible();
    await expect.element(page.getByText("72%")).toBeVisible();
  });

  it("colours the note by tone, and draws its trend as decoration ending on the Ember point", async () => {
    const { container } = await render(<Strip />);
    const notes = container.querySelectorAll<HTMLElement>("[data-slot=stat-note]");
    expect(getComputedStyle(notes[0] as HTMLElement).color).toBe(
      tokenColor("--qx-color-text-success"),
    );
    expect(getComputedStyle(notes[2] as HTMLElement).color).toBe(
      tokenColor("--qx-color-text-danger"),
    );
    expect(getComputedStyle(notes[3] as HTMLElement).color).toBe(
      tokenColor("--qx-color-text-warning"),
    );
    const trends = container.querySelectorAll("[data-slot=stat-trend]");
    expect(trends).toHaveLength(2);
    const trend = trends[0] as SVGElement;
    expect(trend.getAttribute("aria-hidden")).toBe("true");
    const end = trend.querySelector(".qx-stat-trend-end") as SVGCircleElement;
    expect(getComputedStyle(end).fill).toBe(tokenColor("--qx-color-border-brand"));
    // The last point sits at the right edge, at the top: it's the series maximum.
    expect(end.getAttribute("cx")).toBe("88");
    expect(Number(end.getAttribute("cy"))).toBeLessThan(5);
  });

  it("draws no trend for fewer than two points, and a flat line for a constant series", async () => {
    const { container } = await render(
      <StatGroup>
        <Stat label="One" value={1} trend={[4]} />
        <Stat label="Flat" value={2} trend={[3, 3, 3]} />
      </StatGroup>,
    );
    const trends = container.querySelectorAll("[data-slot=stat-trend]");
    expect(trends).toHaveLength(1);
    expect(trends[0]?.querySelector(".qx-stat-trend-line")?.getAttribute("d")).toBe(
      "M0.0 14.0 L44.0 14.0 L88.0 14.0",
    );
  });

  it("rules its cells apart", async () => {
    await page.viewport(1000, 200);
    const { container } = await render(<Strip />);
    const cells = container.querySelectorAll<HTMLElement>("[data-slot=stat]");
    expect(getComputedStyle(cells[0] as HTMLElement).borderInlineStartWidth).toBe("0px");
    expect(getComputedStyle(cells[1] as HTMLElement).borderInlineStartWidth).toBe("1px");
  });

  it("is accessible and looks right in both schemes", async () => {
    await page.viewport(1000, 200);
    const { container } = await render(<Strip />);
    await expectAccessible(container);
    await screenshotSchemes("Stat", "[data-slot=stat-group]");
  });
});
