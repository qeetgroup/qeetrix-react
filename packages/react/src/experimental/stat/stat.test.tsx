import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { ShareBar } from "../chart/chart";
import { PageHeader } from "../page-header/page-header";
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

  it("formats money with currency: whole rupees without paise, and the provider's locale", async () => {
    await render(
      <QeetrixProvider locale="en-IN">
        <StatGroup>
          <Stat label="Collected in October" value={1842600} currency="INR" />
          <Stat label="Average invoice" value={1234.5} currency="INR" />
          <Stat label="In dollars" value={1842600} currency="USD" locale="en-US" />
        </StatGroup>
      </QeetrixProvider>,
    );
    const value = (label: string) =>
      page.getByText(label).element().parentElement?.querySelector("[data-slot=stat-value]")
        ?.textContent;
    expect(value("Collected in October")).toBe("₹18,42,600");
    expect(value("Average invoice")).toBe("₹1,234.50");
    expect(value("In dollars")).toBe("$1,842,600");
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

  it("follows QeetrixProvider's locale by default; its own locale wins", async () => {
    await render(
      <QeetrixProvider locale="en-US">
        <StatGroup>
          <Stat label="Collected" value={128400} />
          <Stat label="Collected" value={128400} locale="de-DE" />
        </StatGroup>
      </QeetrixProvider>,
    );
    await expect.element(page.getByText("128,400")).toBeVisible();
    await expect.element(page.getByText("128.400")).toBeVisible();
  });

  it("holds its place while loading: placeholders on the value's and note's lines, read as Loading", async () => {
    const { container, rerender } = await render(
      <div style={{ inlineSize: 240 }}>
        <StatGroup>
          <Stat label="Total users" value={1284} note="+38 this week" trend={[1, 3, 2, 5]} />
        </StatGroup>
      </div>,
    );
    const stat = () => container.querySelector("[data-slot=stat]") as HTMLElement;
    const loaded = stat().getBoundingClientRect().height;
    await rerender(
      <div style={{ inlineSize: 240 }}>
        <StatGroup>
          <Stat label="Total users" value={undefined} loading trend={[1, 3, 2, 5]} />
        </StatGroup>
      </div>,
    );
    expect(stat().getAttribute("aria-busy")).toBe("true");
    expect(stat().querySelectorAll("[data-slot=skeleton]")).toHaveLength(2);
    expect(stat().querySelector("[data-slot=stat-trend]")).toBeNull();
    // The definition reads "Loading"; the note's placeholder is hidden.
    await expect.element(page.getByRole("definition").first()).toHaveTextContent("Loading");
    expect(stat().querySelector("[data-slot=stat-note]")?.getAttribute("aria-hidden")).toBe("true");
    // The same height, to a sixty-fourth of a pixel: line heights are fractional (24px × 1.3333).
    expect(stat().getBoundingClientRect().height).toBeCloseTo(loaded, 1);
  });

  it("says Loading in the provider's language", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <StatGroup>
          <Stat label="कुल उपयोगकर्ता" value={undefined} loading />
        </StatGroup>
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("definition").first()).toHaveTextContent("लोड हो रहा है");
  });

  it("wraps into rows that each keep the gutter, with a rule between rows and none at their starts", async () => {
    const gutter = 32;
    const { container } = await render(
      <div style={{ "--qx-stat-group-inset": `${gutter}px` } as React.CSSProperties}>
        <Strip />
      </div>,
    );
    const group = container.querySelector("[data-slot=stat-group]") as HTMLElement;
    const cells = [...container.querySelectorAll<HTMLElement>("[data-slot=stat]")];
    // Thirds of 700px aren't whole pixels: "the same" is within a sixty-fourth.
    const same = (actual: number, expected: number, where: string) =>
      expect(actual, where).toBeCloseTo(expected, 1);
    // Width → columns: 1000 → 4 (one row), 700 → 3, 500 → 2, 360 → 1.
    for (const [width, columns] of [
      [1000, 4],
      [700, 3],
      [500, 2],
      [360, 1],
    ] as const) {
      group.style.inlineSize = `${width}px`;
      const edge = group.getBoundingClientRect();
      cells.forEach((cell, index) => {
        const label = (
          cell.querySelector("[data-slot=stat-label]") as HTMLElement
        ).getBoundingClientRect();
        const column = index % columns;
        const where = `${width}px, cell ${index + 1}`;
        const ruleBefore = getComputedStyle(cell).borderInlineStartWidth;
        const ruleAbove = getComputedStyle(cell, "::before");
        if (column === 0) {
          // A row's first cell starts at the gutter, with no rule before it.
          same(label.left - edge.left, gutter, where);
          expect(ruleBefore, where).toBe("0px");
        } else {
          expect(ruleBefore, where).toBe("1px");
        }
        // A full row's last cell ends at the gutter; a short last row's last cell keeps its inset.
        if (column === columns - 1) same(edge.right - label.right, gutter, where);
        // A rule above every row after the first, across the whole strip.
        if (index >= columns) {
          expect(ruleAbove.content, where).not.toBe("none");
          same(Number.parseFloat(ruleAbove.width), width, where);
          expect(ruleAbove.borderBlockStartWidth, where).toBe("1px");
        } else {
          expect(ruleAbove.content, where).toBe("none");
        }
      });
      // Rows line up: a wrapped row's cells sit under the first row's columns.
      if (columns < cells.length) {
        const first = (cells[0] as HTMLElement).getBoundingClientRect();
        const wrapped = (cells[columns] as HTMLElement).getBoundingClientRect();
        same(wrapped.left, first.left, `${width}px`);
        same(wrapped.width, first.width, `${width}px`);
      }
    }
  });

  it("keeps the page gutter on every wrapped row in a PageHeader below 840px", async () => {
    await page.viewport(720, 600);
    const { container } = await render(
      <PageHeader title="Users" summary={<Strip />} style={{ margin: 0 }} />,
    );
    const group = container.querySelector("[data-slot=stat-group]") as HTMLElement;
    const title = (container.querySelector("h1") as HTMLElement).getBoundingClientRect();
    const edge = group.getBoundingClientRect();
    const cells = [...container.querySelectorAll<HTMLElement>("[data-slot=stat]")];
    const starts = cells.map((cell) =>
      Math.round(
        (cell.querySelector("[data-slot=stat-label]") as HTMLElement).getBoundingClientRect().left -
          edge.left,
      ),
    );
    // Three columns at 720px: the fourth Stat starts a row, on the title's line, like the first.
    expect(starts[0]).toBe(title.left - edge.left);
    expect(starts[3]).toBe(starts[0]);
    expect(getComputedStyle(cells[3] as HTMLElement).borderInlineStartWidth).toBe("0px");
  });

  it("carries a small chart and a link into the list, for a summary band's richer cells", async () => {
    const { container } = await render(
      <PageHeader
        title="People"
        style={{ margin: 0 }}
        summary={
          <StatGroup>
            <Stat
              label="People"
              value={1284}
              note="In 12 organisations"
              chart={
                <ShareBar
                  label="Last active"
                  parts={[
                    { id: "today", value: 300, label: "Today" },
                    { id: "older", value: 984, label: "Older" },
                  ]}
                />
              }
              action={<a href="#inactive">Show the 984 inactive</a>}
            />
            <Stat label="Two-step" value="84%" note="Target 90%" tone="warning" />
          </StatGroup>
        }
      />,
    );
    const cell = container.querySelector("[data-slot=stat]") as HTMLElement;
    const chart = cell.querySelector("[data-slot=stat-chart]") as HTMLElement;
    const note = cell.querySelector("[data-slot=stat-note]") as HTMLElement;
    expect(chart.tagName).toBe("DD");
    expect(chart.getBoundingClientRect().top).toBeGreaterThan(note.getBoundingClientRect().bottom);
    expect(Math.round(chart.getBoundingClientRect().width)).toBe(
      Math.round(note.getBoundingClientRect().width),
    );
    await expect
      .element(page.getByRole("img", { name: "Last active: Today 300, Older 984" }))
      .toBeVisible();
    const link = page.getByRole("link", { name: "Show the 984 inactive" });
    expect(link.element().closest("[data-slot=stat-action]")).not.toBeNull();
    await expectAccessible(container);
  });

  it("looks right wrapped and loading, in both schemes", async () => {
    await page.viewport(760, 600);
    const { container } = await render(
      <Stage>
        <div style={{ display: "grid", gap: 16, inlineSize: 700 }}>
          <div style={{ background: "var(--qx-color-surface-raised)" }}>
            <Strip />
          </div>
          <div style={{ background: "var(--qx-color-surface-raised)" }}>
            <StatGroup>
              <Stat label="Total users" value={undefined} loading />
              <Stat label="Passkey adoption" value={undefined} loading />
              <Stat
                label="Failed sign-ins"
                value={312}
                note="Up 40% on last week"
                tone="negative"
              />
            </StatGroup>
          </div>
        </div>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Stat · wrapped and loading");
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
