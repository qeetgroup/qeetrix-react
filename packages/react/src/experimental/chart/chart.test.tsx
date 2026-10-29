import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
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
