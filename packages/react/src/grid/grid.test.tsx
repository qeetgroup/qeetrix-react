import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Box } from "../box/box";
import { Grid } from "./grid";

const columnsOf = (element: Element) =>
  getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length;

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
});
