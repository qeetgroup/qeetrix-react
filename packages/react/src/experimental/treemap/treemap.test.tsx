import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { ProportionalCircles, squarify, Treemap, type TreemapNode } from "./treemap";

const DEPARTMENTS: TreemapNode[] = [
  {
    id: "eng",
    label: "Engineering",
    value: 60,
    href: "#eng",
    children: [
      { id: "id", label: "Identity", value: 30 },
      { id: "pay", label: "Payments", value: 20 },
      { id: "none", label: "No team", value: 10, tone: "none" },
    ],
  },
  { id: "sales", label: "Sales", value: 25, href: "#sales" },
  { id: "none", label: "No department", value: 15, tone: "none" },
];

describe("squarify", () => {
  it("fills the rectangle with one near-square tile per value, areas true to the values", () => {
    const rects = squarify([6, 6, 4, 3, 2, 2, 1], { x: 0, y: 0, w: 6, h: 4 });
    const areas = rects.map((r) => Math.round(r.w * r.h * 100) / 100);
    expect(areas).toEqual([6, 6, 4, 3, 2, 2, 1]);
    for (const r of rects) expect(Math.max(r.w / r.h, r.h / r.w)).toBeLessThan(3);
  });
});

describe("Treemap", () => {
  it("sizes each tile by its value, the children inside it, and names each tile in full", async () => {
    const { container } = await render(
      <div style={{ inlineSize: 600 }}>
        <Treemap nodes={DEPARTMENTS} aria-label="Departments by people" />
      </div>,
    );
    await expect.element(page.getByRole("list", { name: "Departments by people" })).toBeVisible();
    const link = page.getByRole("link", { name: /^Engineering/ });
    await expect
      .element(link)
      .toHaveAccessibleName("Engineering, 60: Identity 30, Payments 20, No team 10");
    await expect.element(link).toHaveAttribute("href", "#eng");
    const tiles = [...container.querySelectorAll<HTMLElement>(".qx-treemap-tile")];
    const area = (el: HTMLElement) =>
      el.getBoundingClientRect().width * el.getBoundingClientRect().height;
    expect(area(tiles[0] as HTMLElement) / area(tiles[1] as HTMLElement)).toBeCloseTo(60 / 25, 0);
    const children = tiles[0]?.querySelector(".qx-treemap-children") as HTMLElement;
    expect(children.getAttribute("aria-hidden")).toBe("true");
    expect(getComputedStyle(tiles[2] as HTMLElement).backgroundColor).toBe(
      tokenColor("--qx-color-bg-neutral-subtle"),
    );
  });

  it("makes the whole tile the link's target, its name starting with what's seen", async () => {
    const { container } = await render(
      <div style={{ inlineSize: 600 }}>
        <Treemap nodes={DEPARTMENTS} aria-label="Departments" />
      </div>,
    );
    const tile = container.querySelector(".qx-treemap-tile") as HTMLElement;
    const box = tile.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.bottom - 6);
    expect(hit?.closest("a")?.getAttribute("href")).toBe("#eng");
  });
});

describe("ProportionalCircles", () => {
  it("draws areas true to the values, with a floor, and says each in words", async () => {
    const { container } = await render(
      <ProportionalCircles
        groups={[
          {
            id: "in",
            label: "India",
            meta: "130 people",
            items: [
              { id: "blr", label: "Bengaluru", value: 100 },
              { id: "pune", label: "Pune", value: 25 },
              { id: "goa", label: "Goa", value: 1 },
            ],
          },
          {
            id: "sg",
            label: "Singapore",
            tone: "reference",
            items: [{ id: "sg", label: "Singapore", value: 4 }],
          },
        ]}
      />,
    );
    const svgs = [...container.querySelectorAll("svg")].map((svg) =>
      Number(svg.getAttribute("width")),
    );
    expect(svgs[0]).toBe(80);
    expect(svgs[1]).toBe(40);
    expect(svgs[2]).toBe(10);
    expect(container.querySelectorAll("text")).toHaveLength(2);
    await expect.element(page.getByText("Goa, 1")).toBeInTheDocument();
    await expect.element(page.getByText("Goa · 1")).toBeVisible();
    const other = container.querySelectorAll(".qx-circles-dot")[3] as SVGElement;
    expect(getComputedStyle(other).fill).toBe(tokenColor("--qx-color-dataviz-reference"));
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <div style={{ display: "grid", gap: 24, inlineSize: 600 }}>
          <Treemap nodes={DEPARTMENTS} aria-label="Departments by people" />
          <ProportionalCircles
            groups={[
              {
                id: "in",
                label: "India",
                meta: "130 people",
                items: [
                  { id: "blr", label: "Bengaluru", value: 100 },
                  { id: "pune", label: "Pune", value: 25 },
                  { id: "goa", label: "Goa", value: 3 },
                ],
              },
            ]}
          />
        </div>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Treemap");
  });
});
