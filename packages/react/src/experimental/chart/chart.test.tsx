import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { contrast, tokenColor } from "../../../tests/support/color";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import {
  BarList,
  ChartLegend,
  ChartTooltip,
  ColumnChart,
  ShareBar,
  SpanChart,
  Sparkline,
} from "./chart";

const box = (el: Element | null | undefined) => (el as Element).getBoundingClientRect();

const lastActive = [
  { id: "today", value: 3, label: "Today", href: "#today" },
  { id: "week", value: 5, label: "This week", href: "#week" },
  { id: "older", value: 0, label: "Older" },
  { id: "never", value: 2, label: "Never" },
];

const days = [
  { id: "27", label: "27 Oct", values: [8, 2] },
  { id: "28", label: "28 Oct", values: [12, 0] },
  { id: "29", label: "29 Oct", values: [4, 4] },
];
const outcomes = [{ label: "Succeeded" }, { label: "Failed", tone: "negative" as const }];

describe("Sparkline", () => {
  it("is decoration by default, an image once it's named, and nothing with one value", async () => {
    const { container } = await render(
      <div>
        <Sparkline values={[1, 4, 2, 6]} data-testid="plain" />
        <Sparkline values={[1, 4, 2, 6]} label="Sign-ins, the last 14 days" />
        <Sparkline values={[3]} data-testid="single" />
      </div>,
    );
    const plain = container.querySelector("[data-testid=plain]");
    expect(plain?.getAttribute("aria-hidden")).toBe("true");
    expect(plain?.hasAttribute("role")).toBe(false);
    await expect
      .element(page.getByRole("img", { name: "Sign-ins, the last 14 days" }))
      .toBeVisible();
    expect(container.querySelector("[data-testid=single]")).toBeNull();
  });

  it("rings its latest value at the end and shares a scale through max", async () => {
    const { container } = await render(
      <div>
        <Sparkline values={[0, 10]} data-testid="own" />
        <Sparkline values={[0, 10]} max={20} data-testid="shared" />
      </div>,
    );
    const own = container.querySelector("[data-testid=own] circle") as SVGCircleElement;
    const shared = container.querySelector("[data-testid=shared] circle") as SVGCircleElement;
    expect(Number(own.getAttribute("cx"))).toBe(116);
    expect(Number(own.getAttribute("cy"))).toBe(4);
    expect(Number(shared.getAttribute("cy"))).toBe(18);
    expect(getComputedStyle(own).stroke).toBe(tokenColor("--qx-color-surface-raised"));
    expect(getComputedStyle(own).fill).toBe(tokenColor("--qx-color-dataviz-categorical-1"));
  });
});

describe("ShareBar", () => {
  it("sizes each part by its share, 2px apart, and is an image whose name lists them", async () => {
    const { container } = await render(
      <div style={{ inlineSize: 404 }}>
        <ShareBar parts={lastActive} label="Last active" />
      </div>,
    );
    await expect
      .element(
        page.getByRole("img", { name: "Last active: Today 3, This week 5, Older 0, Never 2" }),
      )
      .toBeVisible();
    const parts = [...container.querySelectorAll(".qx-share-bar-part")];
    expect(parts).toHaveLength(3);
    const [today, week, never] = parts.map(box);
    expect(Math.round(today?.width ?? 0)).toBe(120);
    expect(Math.round(week?.width ?? 0)).toBe(200);
    expect(Math.round(never?.width ?? 0)).toBe(80);
    expect(Math.round((week?.left ?? 0) - (today?.right ?? 0))).toBe(2);
  });

  it("with a legend, counts and names every part, linking those with an href", async () => {
    await render(<ShareBar parts={lastActive} label="Last active" legend />);
    const legend = page.getByRole("list", { name: "Last active" });
    await expect.element(legend).toBeVisible();
    expect(legend.getByRole("listitem").elements()).toHaveLength(4);
    await expect
      .element(page.getByRole("link", { name: "3 Today" }))
      .toHaveAttribute("href", "#today");
    expect(page.getByRole("link").elements()).toHaveLength(2);
    expect(page.getByRole("img").elements()).toHaveLength(0);
  });
});

/** When people were last active: an ordered whole, with "never" as its neutral end. */
const ordered = [
  { id: "today", value: 3, label: "Today" },
  { id: "week", value: 5, label: "This week" },
  { id: "older", value: 4, label: "This month or older" },
  { id: "never", value: 2, label: "Never", tone: "reference" as const },
];

describe("ShareBar, sequential", () => {
  const html = document.documentElement;
  const STEPS = ["sequential-7", "sequential-6", "sequential-5"] as const;
  const color = (element: Element | undefined) =>
    getComputedStyle(element as Element).backgroundColor;

  for (const dir of ["ltr", "rtl"] as const) {
    it(`steps the ramp in the parts' order, strongest first, to a neutral end (${dir})`, async () => {
      html.dir = dir;
      try {
        const { container } = await render(
          <div style={{ inlineSize: 404 }}>
            <ShareBar parts={ordered} label="Last active" tone="sequential" legend />
          </div>,
        );
        const parts = [...container.querySelectorAll(".qx-share-bar-part")];
        const swatches = [...container.querySelectorAll(".qx-chart-swatch")];
        const expected = [...STEPS, "reference"].map((step) =>
          tokenColor(`--qx-color-dataviz-${step}`),
        );
        expect(parts.map(color)).toEqual(expected);
        expect(swatches.map(color)).toEqual(expected);
        // The order reads the way the page does: today at the start edge.
        const lefts = parts.map((part) => box(part).left);
        const sorted = [...lefts].sort((a, b) => a - b);
        expect(lefts).toEqual(dir === "ltr" ? sorted : [...sorted].reverse());
        // The legend reads the parts in their order.
        const items = page.getByRole("list", { name: "Last active" }).getByRole("listitem");
        expect(items.elements().map((item) => item.textContent)).toEqual([
          "3Today",
          "5This week",
          "4This month or older",
          "2Never",
        ]);
      } finally {
        html.removeAttribute("dir");
      }
    });
  }

  it("keeps each part's step when another is zero, and its name lists them in order", async () => {
    const { container } = await render(
      <ShareBar
        parts={ordered.map((part) => (part.id === "week" ? { ...part, value: 0 } : part))}
        label="Last active"
        tone="sequential"
      />,
    );
    await expect
      .element(
        page.getByRole("img", {
          name: "Last active: Today 3, This week 0, This month or older 4, Never 2",
        }),
      )
      .toBeVisible();
    const parts = [...container.querySelectorAll(".qx-share-bar-part")];
    expect(parts.map(color)).toEqual(
      ["sequential-7", "sequential-5", "reference"].map((step) =>
        tokenColor(`--qx-color-dataviz-${step}`),
      ),
    );
  });

  it("keeps every step and the neutral end at 3:1 or more on every surface, light and dark", () => {
    const surfaces = ["default", "canvas", "raised", "overlay", "sunken"];
    const below: string[] = [];
    for (const scheme of ["light", "dark"]) {
      html.dataset.qxColorScheme = scheme;
      for (const step of [...STEPS, "reference"]) {
        for (const surface of surfaces) {
          const ratio = contrast(
            tokenColor(`--qx-color-dataviz-${step}`),
            tokenColor(`--qx-color-surface-${surface}`),
          );
          if (ratio < 3) below.push(`${scheme} ${step} on ${surface}: ${ratio.toFixed(2)}`);
        }
      }
    }
    delete html.dataset.qxColorScheme;
    expect(below).toEqual([]);
  });

  it("gives Sparkline and ColumnChart the same steps, so a band's charts agree", async () => {
    const { container } = await render(
      <>
        <Sparkline values={[1, 3, 2, 5]} tone="sequential-7" />
        <ColumnChart
          columns={days}
          series={[
            { label: "Succeeded", tone: "sequential-6" },
            { label: "Failed", tone: "sequential-5" },
          ]}
          label="Sign-ins a day"
        />
      </>,
    );
    // The line's end point carries its tone, as the categorical default's does.
    const end = container.querySelector("svg circle") as SVGCircleElement;
    expect(getComputedStyle(end).fill).toBe(tokenColor("--qx-color-dataviz-sequential-7"));
    const [ok, failed] = [
      ...(container.querySelector(".qx-column-chart-column") as Element).children,
    ];
    expect(color(ok)).toBe(tokenColor("--qx-color-dataviz-sequential-6"));
    expect(color(failed)).toBe(tokenColor("--qx-color-dataviz-sequential-5"));
  });

  it("warns in development past three toned parts, and leaves the categorical bar as it was", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const { rerender, container } = await render(
        <ShareBar parts={ordered} label="Last active" tone="sequential" />,
      );
      expect(warn).not.toHaveBeenCalled();
      const five = [
        { id: "today", value: 3, label: "Today" },
        { id: "week", value: 5, label: "This week" },
        { id: "month", value: 4, label: "This month" },
        { id: "older", value: 1, label: "Older" },
        { id: "never", value: 2, label: "Never", tone: "reference" as const },
      ];
      await rerender(<ShareBar parts={five} label="Last active" tone="sequential" />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("at most three toned parts"));
      // Without tone="sequential" the parts take the categorical colours, as before.
      await rerender(<ShareBar parts={five} label="Last active" />);
      const parts = [...container.querySelectorAll(".qx-share-bar-part")];
      expect(parts.slice(0, 4).map(color)).toEqual(
        [1, 2, 3, 4].map((slot) => tokenColor(`--qx-color-dataviz-categorical-${slot}`)),
      );
    } finally {
      warn.mockRestore();
    }
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <div style={{ inlineSize: 320 }}>
          <ShareBar parts={ordered} label="Last active" tone="sequential" legend />
        </div>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Charts · sequential share bar");
  });
});

describe("ColumnChart", () => {
  it("stacks each period's parts on one scale, failures on top in the negative colour", async () => {
    const { container } = await render(
      <div style={{ inlineSize: 300 }}>
        <ColumnChart columns={days} series={outcomes} label="Sign-ins a day" height={48} />
      </div>,
    );
    await expect
      .element(page.getByRole("img", { name: "Sign-ins a day. Busiest: 28 Oct, 12" }))
      .toBeVisible();
    const columns = [...container.querySelectorAll(".qx-column-chart-column")];
    const [first, second, third] = columns.map((column) => [...column.children]);
    expect(second).toHaveLength(1);
    const [ok, failed] = first ?? [];
    expect(box(failed).bottom).toBeLessThanOrEqual(box(ok).top);
    expect(getComputedStyle(failed as Element).backgroundColor).toBe(
      tokenColor("--qx-color-dataviz-negative"),
    );
    const total = (parts: Element[] | undefined) =>
      (parts ?? []).reduce((sum, part) => sum + box(part).height, 0);
    expect(Math.round(total(second))).toBe(48);
    expect(Math.round(total(third))).toBe(Math.round(total(first) * (8 / 10)));
  });

  it("with links, each column is a link named for its period and values", async () => {
    await render(
      <ColumnChart
        columns={days.map((day) => ({ ...day, href: `#day-${day.id}` }))}
        series={outcomes}
        label="Deliveries a day"
      />,
    );
    await expect
      .element(page.getByRole("group", { name: "Deliveries a day. Busiest: 28 Oct, 12" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("link", { name: "27 Oct: Succeeded 8, Failed 2" }))
      .toHaveAttribute("href", "#day-27");
  });

  it("draws a part above zero at least 2px tall, from the parts below it: one failure in 500 shows", async () => {
    const html = document.documentElement;
    const sign = [
      { id: "1", label: "1 Nov", values: [499, 1] },
      { id: "2", label: "2 Nov", values: [199, 1] },
      { id: "3", label: "3 Nov", values: [200, 0] },
      { id: "4", label: "4 Nov", values: [1, 1] },
    ];
    for (const height of [32, 48, 96]) {
      for (const scheme of ["light", "dark"]) {
        html.dataset.qxColorScheme = scheme;
        const screen = await render(
          <div style={{ inlineSize: 300 }}>
            <ColumnChart columns={sign} series={outcomes} label="Sign-ins a day" height={height} />
          </div>,
        );
        const where = `${height}px, ${scheme}`;
        const columns = [...screen.container.querySelectorAll(".qx-column-chart-column")];
        const parts = columns.map((column) => [...column.children].map((part) => box(part).height));
        const [full, small, plain, sliver] = parts as [number[], number[], number[], number[]];
        // Every failure shows, 2px however small its share; the floor is the gap's 2px.
        for (const column of [full, small, sliver])
          expect(column[1], where).toBeGreaterThanOrEqual(2);
        expect(full[1], where).toBeCloseTo(2, 1);
        expect(small[1], where).toBeCloseTo(2, 1);
        // The room comes from the part below, so the total holds: 200 is 200 with or without a failure.
        expect((small[0] ?? 0) + (small[1] ?? 0), where).toBeCloseTo(plain[0] ?? 0, 1);
        expect(plain[0], where).toBeCloseTo((200 / 500) * height, 1);
        // A full column stays the chart's height, its gap included.
        const column = columns[0] as Element;
        const top = box(column.lastElementChild).top;
        expect(box(column.firstElementChild).bottom - top, where).toBeLessThanOrEqual(height + 0.5);
        // The failure keeps the negative colour in both schemes.
        expect(getComputedStyle(column.lastElementChild as Element).backgroundColor, where).toBe(
          tokenColor("--qx-color-dataviz-negative"),
        );
        // A column of two events on a 500 scale is too short for two floors: it grows to them.
        expect(sliver, where).toEqual([2, 2]);
        await screen.unmount();
      }
    }
    delete html.dataset.qxColorScheme;
  });

  it("says when there's nothing to show", async () => {
    await render(
      <ColumnChart
        columns={[{ id: "1", label: "1 Oct", values: [0, 0] }]}
        series={outcomes}
        label="Events"
      />,
    );
    await expect.element(page.getByRole("img", { name: "Events. Nothing yet" })).toBeVisible();
  });
});

/** People who joined on each day after their invitation, up to the link's expiry on day 14. */
const JOINS = [5, 12, 6, 3, 2, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0].map((joined, day) => ({
  id: String(day),
  label: `Day ${day}`,
  values: [joined],
}));
const JOINED = [{ label: "Joined" }];
const TICKS = [
  { at: 0, label: "0" },
  { at: 11, label: "Day 11" },
  { at: 14, label: "14 days" },
];

describe("ColumnChart ticks and marker", () => {
  const html = document.documentElement;
  const chart = () => document.querySelector("[data-slot=column-chart]") as HTMLElement;
  const column = (index: number) =>
    chart().querySelectorAll(".qx-column-chart-column")[index] as HTMLElement;
  const centre = (r: DOMRect) => r.left + r.width / 2;

  for (const dir of ["ltr", "rtl"] as const) {
    it(`labels a start, an end and one more under the columns, small and subtle, without overlapping (${dir})`, async () => {
      html.dir = dir;
      try {
        const { container } = await render(
          <div style={{ inlineSize: 320 }}>
            <ColumnChart
              columns={JOINS}
              series={JOINED}
              label="Joined after invitation"
              ticks={TICKS}
            />
            <p>after</p>
          </div>,
        );
        const edge = box(chart());
        const ticks = [...container.querySelectorAll<HTMLElement>(".qx-column-chart-tick")];
        expect(ticks.map((tick) => tick.textContent)).toEqual(["0", "Day 11", "14 days"]);
        const [start, middle, end] = ticks.map((tick) => box(tick)) as [DOMRect, DOMRect, DOMRect];
        // The first and the last on the chart's edges, the reading way; the other on its column.
        if (dir === "ltr") {
          expect(start.left).toBeCloseTo(edge.left, 0);
          expect(end.right).toBeCloseTo(edge.right, 0);
        } else {
          expect(start.right).toBeCloseTo(edge.right, 0);
          expect(end.left).toBeCloseTo(edge.left, 0);
        }
        expect(Math.abs(centre(middle) - centre(box(column(11))))).toBeLessThanOrEqual(1);
        // Apart, under the axis, and the page's next line under them.
        const sorted = [start, middle, end].sort((a, b) => a.left - b.left);
        for (let i = 1; i < sorted.length; i++)
          expect(sorted[i]?.left).toBeGreaterThan((sorted[i - 1] as DOMRect).right);
        for (const tick of [start, middle, end])
          expect(tick.top).toBeGreaterThanOrEqual(edge.bottom);
        expect(box(container.querySelector("p") as Element).top).toBeGreaterThanOrEqual(end.bottom);
        const style = getComputedStyle(ticks[0] as HTMLElement);
        expect(style.color).toBe(tokenColor("--qx-color-text-subtle"));
        expect(style.fontSize).toBe("12px");
        expect(
          container.querySelector("[data-slot=column-chart-ticks]")?.getAttribute("aria-hidden"),
        ).toBe("true");
      } finally {
        html.removeAttribute("dir");
      }
    });
  }

  it("draws a marker at a column, or at the end, its label read after the chart's name", async () => {
    const { rerender } = await render(
      <div style={{ inlineSize: 320 }}>
        <ColumnChart
          columns={JOINS}
          series={JOINED}
          label="Joined after invitation"
          ticks={TICKS}
          marker={{ at: 14, label: "Link expires" }}
        />
      </div>,
    );
    await expect
      .element(page.getByRole("img"))
      .toHaveAccessibleName("Joined after invitation. Busiest: Day 1, 12. Link expires");
    const marker = () => chart().querySelector("[data-slot=column-chart-marker]") as HTMLElement;
    const line = box(marker());
    expect(line.width).toBe(1);
    expect(Math.abs(centre(line) - centre(box(column(14))))).toBeLessThanOrEqual(1);
    // From the top to the axis.
    expect(line.top).toBeCloseTo(box(chart()).top, 0);
    expect(line.bottom).toBeCloseTo(box(chart()).bottom - 1, 0);
    expect(getComputedStyle(marker()).backgroundColor).toBe(
      tokenColor("--qx-color-dataviz-reference"),
    );
    expect(marker().getAttribute("aria-hidden")).toBe("true");
    await rerender(
      <div style={{ inlineSize: 320 }}>
        <ColumnChart
          columns={JOINS}
          series={JOINED}
          label="Joined after invitation"
          marker={{ at: "end", label: "Link expires" }}
        />
      </div>,
    );
    expect(box(marker()).right).toBeCloseTo(box(chart()).right, 0);
    // The columns are as they were, the floor for a small part included.
    expect(box(column(5).firstElementChild as Element).height).toBeGreaterThanOrEqual(2);
  });

  it("looks as before without ticks or a marker", async () => {
    await render(
      <div style={{ inlineSize: 320 }}>
        <ColumnChart columns={JOINS} series={JOINED} label="Joined after invitation" />
      </div>,
    );
    expect(chart().hasAttribute("data-ticks")).toBe(false);
    expect(chart().querySelector("[data-slot=column-chart-ticks]")).toBeNull();
    expect(chart().querySelector("[data-slot=column-chart-marker]")).toBeNull();
    expect(getComputedStyle(chart()).marginBottom).toBe("0px");
    await expect
      .element(page.getByRole("img"))
      .toHaveAccessibleName("Joined after invitation. Busiest: Day 1, 12");
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <div style={{ inlineSize: 320 }}>
          <ColumnChart
            columns={JOINS}
            series={JOINED}
            label="Joined after invitation"
            ticks={TICKS}
            marker={{ at: 14, label: "Link expires" }}
          />
        </div>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Charts · column ticks and marker");
  });
});

describe("BarList", () => {
  it("ranks the items largest first, each bar on one scale", async () => {
    const { container } = await render(
      <div style={{ inlineSize: 400 }}>
        <BarList
          aria-label="Sign-in methods, latest 50"
          items={[
            { id: "password", label: "Password", value: 10 },
            { id: "passkey", label: "Passkey", value: 30, href: "#passkey" },
            { id: "sso", label: "SSO", value: 15 },
          ]}
        />
      </div>,
    );
    const list = page.getByRole("list", { name: "Sign-in methods, latest 50" });
    const items = list.getByRole("listitem").elements();
    expect(items.map((item) => item.textContent)).toEqual(["Passkey30", "SSO15", "Password10"]);
    await expect
      .element(page.getByRole("link", { name: "Passkey" }))
      .toHaveAttribute("href", "#passkey");
    const [passkey, sso] = [...container.querySelectorAll(".qx-bar-list-bar")].map(box);
    expect(Math.round(sso?.width ?? 0)).toBe(Math.round((passkey?.width ?? 0) / 2));
  });
});

describe("SpanChart", () => {
  it("places each span on the shared axis and says it in words", async () => {
    const { container } = await render(
      <div style={{ inlineSize: 500 }}>
        <SpanChart
          aria-label="Sessions, the last 10 days"
          from={0}
          to={1000}
          axis={["10 days ago", "Now"]}
          rows={[
            {
              id: "a",
              label: "Chrome",
              start: 250,
              end: 750,
              description: "7 days ago to 2 days ago",
            },
            { id: "b", label: "Safari", start: 900, end: 1200, description: "1 day ago to now" },
          ]}
        />
      </div>,
    );
    const list = page.getByRole("list", { name: "Sessions, the last 10 days" });
    expect(list.getByRole("listitem").elements()[0]?.textContent).toBe(
      "Chrome, 7 days ago to 2 days ago",
    );
    const tracks = [...container.querySelectorAll(".qx-span-chart-track")].map(box);
    const [chrome, safari] = [...container.querySelectorAll(".qx-span-chart-bar")].map(box);
    const track = tracks[0];
    expect(Math.round((chrome?.left ?? 0) - (track?.left ?? 0))).toBe(
      Math.round((track?.width ?? 0) / 4),
    );
    expect(Math.round(chrome?.width ?? 0)).toBe(Math.round((track?.width ?? 0) / 2));
    expect(Math.round(safari?.right ?? 0)).toBe(Math.round(tracks[1]?.right ?? 0));
  });
});

function Charts() {
  return (
    <div style={{ display: "grid", gap: 24, inlineSize: 420 }}>
      <Sparkline values={[4, 6, 5, 9, 7, 12, 10]} label="Sign-ins, the last week" />
      <ShareBar parts={lastActive} label="Last active" legend />
      <ColumnChart columns={days} series={outcomes} label="Sign-ins a day" />
      <BarList
        aria-label="Methods"
        items={[
          { id: "passkey", label: "Passkey", value: 30 },
          { id: "password", label: "Password", value: 12 },
        ]}
      />
      <SpanChart
        aria-label="Sessions"
        from={0}
        to={10}
        axis={["10 days ago", "Now"]}
        rows={[{ id: "a", label: "Chrome", start: 2, end: 7, description: "8 to 3 days ago" }]}
      />
      <ChartTooltip
        title="Tuesday, 28 October"
        items={[
          { label: "Succeeded", value: "12" },
          { label: "Failed", value: "0", tone: "negative" },
        ]}
      />
      <ChartLegend items={outcomes} aria-label="Outcomes" />
    </div>
  );
}

describe("Charts", () => {
  it("titles a tooltip from the point and keeps text in text colours", async () => {
    const { container } = await render(<Charts />);
    await expect.element(page.getByText("Tuesday, 28 October")).toBeVisible();
    const value = container.querySelector(".qx-chart-tooltip-value") as Element;
    expect(getComputedStyle(value).color).toBe(tokenColor("--qx-color-text-default"));
    expect(
      page.getByRole("list", { name: "Outcomes" }).getByRole("listitem").elements(),
    ).toHaveLength(2);
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <Charts />
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Charts");
  });
});
