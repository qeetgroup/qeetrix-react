import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Box } from "../box/box";
import { Grid, GridItem } from "./grid";

const columnsOf = (element: Element) =>
  getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length;
const rect = (element: Element) => element.getBoundingClientRect();
const slots = (root: Element, name: string) =>
  [...root.querySelectorAll(`[data-slot=${name}]`)] as HTMLElement[];

/** The width of `span` of `columns` equal columns across `total` px, with `gap` px between them. */
const spanWidth = (span: number, columns: number, total: number, gap: number) =>
  ((total - (columns - 1) * gap) / columns) * span + (span - 1) * gap;

/** The window size classes, a width inside each, and what the detail page below shows there. */
const SIZE_CLASSES = [
  { name: "base", width: 500, columns: 1, main: 1, side: 1, sameRow: false },
  { name: "medium", width: 700, columns: 2, main: 2, side: 1, sameRow: false },
  { name: "expanded", width: 1000, columns: 3, main: 2, side: 1, sameRow: true },
  { name: "large", width: 1300, columns: 4, main: 3, side: 1, sameRow: true },
  { name: "xlarge", width: 1700, columns: 12, main: 8, side: 4, sameRow: true },
] as const;

describe("Grid", () => {
  it("lays out equal columns with the token gap", async () => {
    const { container } = await render(
      <Grid columns={3} gap="lg">
        <span>1</span>
        <span>2</span>
        <span>3</span>
      </Grid>,
    );
    const grid = container.querySelector("[data-slot=grid]") as HTMLElement;
    expect(columnsOf(grid)).toBe(3);
    expect(getComputedStyle(grid).columnGap).toBe("16px");
  });

  it("changes columns at the window size classes", async () => {
    const { container } = await render(
      <Grid columns={{ base: 1, medium: 2, expanded: 4 }}>
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
      </Grid>,
    );
    const grid = container.querySelector("[data-slot=grid]") as HTMLElement;
    await page.viewport(500, 800);
    expect(columnsOf(grid)).toBe(1);
    await page.viewport(700, 800);
    expect(columnsOf(grid)).toBe(2);
    await page.viewport(1000, 800);
    expect(columnsOf(grid)).toBe(4);
    // large is unset, so it inherits expanded.
    await page.viewport(1300, 800);
    expect(columnsOf(grid)).toBe(4);
  });

  it("drops a list's bullets and indent when it renders one, and keeps the list role", async () => {
    const { container } = await render(
      <>
        <ol data-testid="plain">
          <li>Plain</li>
        </ol>
        <Grid render={<ol />} columns={2}>
          <GridItem render={<li />}>First</GridItem>
          <li>Second</li>
        </Grid>
      </>,
    );
    // No CSS reset is loaded on the test page: a plain list keeps the browser's margin and indent.
    const plain = getComputedStyle(container.querySelector("[data-testid=plain]") as HTMLElement);
    expect(plain.paddingInlineStart).toBe("40px");
    expect(plain.marginBlockStart).not.toBe("0px");
    const grid = slots(container, "grid")[0] as HTMLElement;
    const style = getComputedStyle(grid);
    expect([style.marginBlockStart, style.marginBlockEnd, style.paddingInlineStart]).toEqual([
      "0px",
      "0px",
      "0px",
    ]);
    const [first, second] = [...grid.children] as HTMLElement[];
    expect(getComputedStyle(first as HTMLElement).listStyleType).toBe("none");
    expect(rect(first as HTMLElement).left).toBe(rect(grid).left);
    expect(rect(first as HTMLElement).top).toBe(rect(grid).top);
    expect(rect(second as HTMLElement).top).toBe(rect(grid).top);
    expect(grid.getAttribute("role")).toBe("list");
    expect(page.getByRole("listitem").elements()).toHaveLength(3);
  });

  it("spans columns at each window size class: a main column and a side column", async () => {
    const { container } = await render(
      <Grid columns={{ base: 1, medium: 2, expanded: 3, large: 4, xlarge: 12 }} gap="lg">
        <GridItem span={{ medium: 2, expanded: 2, large: 3, xlarge: 8 }}>Main</GridItem>
        <GridItem span={{ xlarge: 4 }}>Side</GridItem>
      </Grid>,
    );
    const grid = slots(container, "grid")[0] as HTMLElement;
    const [main, side] = slots(container, "grid-item") as [HTMLElement, HTMLElement];
    for (const size of SIZE_CLASSES) {
      await page.viewport(size.width, 800);
      const total = rect(grid).width;
      expect(columnsOf(grid), size.name).toBe(size.columns);
      expect(rect(main).width, size.name).toBeCloseTo(
        spanWidth(size.main, size.columns, total, 16),
        1,
      );
      expect(rect(side).width, size.name).toBeCloseTo(
        spanWidth(size.side, size.columns, total, 16),
        1,
      );
      expect(rect(main).left, size.name).toBe(rect(grid).left);
      if (size.sameRow) {
        // The side column starts one gap after the main one, and ends at the grid's edge.
        expect(rect(side).top, size.name).toBe(rect(main).top);
        expect(rect(side).left - rect(main).right, size.name).toBeCloseTo(16, 1);
        expect(rect(side).right, size.name).toBeCloseTo(rect(grid).right, 1);
      } else {
        expect(rect(side).top - rect(main).bottom, size.name).toBeCloseTo(16, 1);
        expect(rect(side).left, size.name).toBe(rect(grid).left);
      }
    }
  });

  it("starts a cell in a column, per window size class", async () => {
    const { container } = await render(
      <Grid columns={{ base: 2, large: 4 }} gap="none" style={{ inlineSize: 400 }}>
        <GridItem start={{ large: 3 }} span={2}>
          Cell
        </GridItem>
      </Grid>,
    );
    const grid = slots(container, "grid")[0] as HTMLElement;
    const cell = slots(container, "grid-item")[0] as HTMLElement;
    await page.viewport(700, 800);
    // Unset below large: the next free cell, the first.
    expect(rect(cell).left - rect(grid).left).toBe(0);
    expect(rect(cell).width).toBe(400);
    await page.viewport(1300, 800);
    expect(rect(cell).left - rect(grid).left).toBe(200);
    expect(rect(cell).width).toBe(200);
  });

  it("never adds a column: a span or start past the grid's columns is cut to fit", async () => {
    const { container } = await render(
      <Grid columns={{ base: 1, expanded: 3 }} gap="none" style={{ inlineSize: 300 }}>
        <GridItem span={12}>Wide</GridItem>
        <GridItem start={5} span={2}>
          Late
        </GridItem>
      </Grid>,
    );
    const grid = slots(container, "grid")[0] as HTMLElement;
    const [wide, late] = slots(container, "grid-item") as [HTMLElement, HTMLElement];
    for (const [width, columns] of [
      [500, 1],
      [1000, 3],
    ] as const) {
      await page.viewport(width, 800);
      expect(columnsOf(grid), `${width}px`).toBe(columns);
      expect(rect(wide).width, `${width}px`).toBe(300);
      // Started past the end, it takes the last column, one wide.
      expect(rect(late).width, `${width}px`).toBe(300 / columns);
      expect(rect(late).right, `${width}px`).toBe(rect(grid).right);
    }
  });

  it("reads only its own counts when nested in another grid", async () => {
    await page.viewport(1300, 800);
    const { container } = await render(
      <Grid columns={{ base: 1, large: 3 }} gap="none" style={{ inlineSize: 600 }}>
        <GridItem span={{ large: 2 }}>
          <Grid columns={2} gap="none">
            <GridItem>One</GridItem>
            <GridItem>Two</GridItem>
          </Grid>
        </GridItem>
        <div>Side</div>
      </Grid>,
    );
    const [outer, inner] = slots(container, "grid") as [HTMLElement, HTMLElement];
    const [main, one, two] = slots(container, "grid-item") as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ];
    expect(columnsOf(outer)).toBe(3);
    expect(rect(main).width).toBe(400);
    // Not the outer grid's 3 columns, nor the outer cell's span of 2.
    expect(columnsOf(inner)).toBe(2);
    expect(rect(one).width).toBe(200);
    expect(rect(two).width).toBe(200);
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(900, 600);
    const { container } = await render(
      <Stage>
        <Grid columns={3} gap="md">
          {["One", "Two", "Three", "Four", "Five", "Six"].map((label) => (
            <Box key={label} padding="md" background="raised" border="default" radius="surface">
              {label}
            </Box>
          ))}
        </Grid>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Grid");
  });

  it("is accessible with spanning cells, and looks right in both schemes", async () => {
    await page.viewport(1300, 800);
    const { container } = await render(
      <Stage>
        <Grid columns={{ base: 1, large: 3 }} gap="lg" render={<ul />} style={{ inlineSize: 720 }}>
          <GridItem span={{ large: 2 }} render={<li />}>
            <Box padding="lg" background="raised" border="default" radius="surface">
              Main column: span 2
            </Box>
          </GridItem>
          <GridItem render={<li />}>
            <Box padding="lg" background="raised" border="default" radius="surface">
              Side column
            </Box>
          </GridItem>
          <GridItem span={3} render={<li />}>
            <Box padding="lg" background="sunken" border="default" radius="surface">
              Full width: span 3
            </Box>
          </GridItem>
        </Grid>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Grid · spans");
  });
});
