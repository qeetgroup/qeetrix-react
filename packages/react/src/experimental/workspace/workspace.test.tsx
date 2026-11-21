import { useState } from "react";
import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tab } from "../../../tests/support/keyboard";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { Button } from "../../button/button";
import { Toggle } from "../../toggle/toggle";
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
  Workspace,
  type WorkspaceLayout,
  WorkspaceMain,
  WorkspaceOutput,
  WorkspacePane,
} from "./workspace";

function Policies({ width = 1100 }: { width?: number }) {
  const [view, setView] = useState<"decision" | "trace">("decision");
  return (
    <div style={{ display: "flex", flexDirection: "column", inlineSize: width, blockSize: 520 }}>
      <Toolbar
        aria-label="Policies"
        start={<strong>Admins can reset passwords</strong>}
        end={<Button>Save</Button>}
      >
        <ToolbarGroup>
          <ToolbarButton>Undo</ToolbarButton>
          <ToolbarButton>Redo</ToolbarButton>
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarButton>Run test</ToolbarButton>
      </Toolbar>
      <Workspace style={{ flex: 1 }}>
        <WorkspacePane side="list" label="Policies" meta="12">
          <p style={{ margin: 16 }}>A list</p>
        </WorkspacePane>
        <WorkspaceMain
          aria-label="Policy"
          output={
            <WorkspaceOutput
              aria-label="Result"
              views={[
                { value: "decision", label: "Decision" },
                { value: "trace", label: "Trace" },
              ]}
              value={view}
              onValueChange={setView}
            >
              {view === "decision" ? "Allowed" : "Matched rule 2"}
            </WorkspaceOutput>
          }
        >
          <div style={{ blockSize: 900 }}>The canvas</div>
        </WorkspaceMain>
        <WorkspacePane
          side="inspector"
          label="Details"
          footer={<Button variant="ghost">Delete</Button>}
        >
          <p style={{ margin: 16 }}>Inspector</p>
        </WorkspacePane>
      </Workspace>
    </div>
  );
}

describe("Toolbar", () => {
  it("is one Tab stop: the arrow keys move between its buttons", async () => {
    await render(<Policies />);
    await expect.element(page.getByRole("toolbar", { name: "Policies" })).toBeVisible();
    await tab();
    await expect.element(page.getByRole("button", { name: "Undo" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(page.getByRole("button", { name: "Redo" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(page.getByRole("button", { name: "Run test" })).toHaveFocus();
    await tab();
    await expect.element(page.getByRole("button", { name: "Save" })).toHaveFocus();
  });
});

describe("Workspace", () => {
  it("rules its panes edge to edge, each scrolling on its own, the output docked under the canvas", async () => {
    const { container } = await render(<Policies />);
    const [list, inspector] = page
      .getByRole("region")
      .elements()
      .filter((el) => el.matches("[data-slot=workspace-pane]"));
    expect(list?.getAttribute("aria-labelledby")).toBeTruthy();
    await expect.element(page.getByRole("region", { name: "Policies" })).toBeVisible();
    await expect.element(page.getByRole("region", { name: "Policy" })).toBeVisible();
    const canvas = container.querySelector(".qx-workspace-canvas") as HTMLElement;
    expect(canvas.scrollHeight).toBeGreaterThan(canvas.clientHeight);
    const output = container.querySelector(".qx-workspace-output") as HTMLElement;
    expect(Math.round(output.getBoundingClientRect().top)).toBe(
      Math.round(canvas.getBoundingClientRect().bottom),
    );
    expect(Math.round((inspector as HTMLElement).getBoundingClientRect().width)).toBe(336);
    await userEvent.click(page.getByRole("tab", { name: "Trace" }));
    await expect.element(page.getByText("Matched rule 2")).toBeVisible();
  });

  it("stacks its panes in a narrow box", async () => {
    const { container } = await render(<Policies width={600} />);
    const panes = [...container.querySelectorAll<HTMLElement>("[data-slot=workspace-grid] > *")];
    const lefts = panes.map((pane) => Math.round(pane.getBoundingClientRect().left));
    expect(new Set(lefts).size).toBe(1);
    expect(panes[1]?.getBoundingClientRect().top).toBeGreaterThan(
      panes[0]?.getBoundingClientRect().top ?? 0,
    );
    // Stacked, they scroll together: the box scrolls, its grid as tall as the panes.
    const workspace = container.querySelector("[data-slot=workspace]") as HTMLElement;
    expect(workspace.scrollHeight).toBeGreaterThan(workspace.clientHeight);
    expect(workspace.scrollWidth).toBeLessThanOrEqual(600);
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <Policies width={960} />
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("Workspace");
  });
});

/** Each layout's panes, with a control in each, as Authorization › Testing has. */
function Layout({ layout, width }: { layout: WorkspaceLayout; width: number }) {
  const list = layout === "three" || layout === "list-main";
  const inspector = layout === "three" || layout === "main-inspector";
  return (
    <div style={{ inlineSize: width, blockSize: 600 }}>
      <Workspace layout={layout}>
        {list && (
          <WorkspacePane side="list" label="Policies" meta="12">
            <Toggle>Only failing</Toggle>
          </WorkspacePane>
        )}
        <WorkspaceMain aria-label="Policy">
          <Button>Run test</Button>
        </WorkspaceMain>
        {inspector && (
          <WorkspacePane side="inspector" label="Details">
            <Button variant="ghost">Delete</Button>
          </WorkspacePane>
        )}
      </Workspace>
    </div>
  );
}

const LAYOUTS: WorkspaceLayout[] = ["three", "list-main", "main-inspector", "main"];
const regions = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>(
    "[data-slot=workspace-pane], [data-slot=workspace-main]",
  ),
];

describe("Workspace, in a wide box", () => {
  // Each layout's side tracks (15.5rem list, 21rem or 24rem inspector), the canvas taking the rest,
  // every pane the box's full height: as before.
  const widths: Record<WorkspaceLayout, number[]> = {
    three: [248, 1100 - 248 - 336, 336],
    "list-main": [248, 1100 - 248],
    "main-inspector": [1100 - 384, 384],
    main: [1100],
  };
  for (const layout of LAYOUTS) {
    it(`keeps ${layout}'s tracks side by side, each pane the box's height`, async () => {
      const { container } = await render(<Layout layout={layout} width={1100} />);
      const panes = regions(container);
      expect(
        panes.map((pane) => Math.round(pane.getBoundingClientRect().width)),
        layout,
      ).toEqual(widths[layout]);
      expect(new Set(panes.map((pane) => pane.getBoundingClientRect().top)).size, layout).toBe(1);
      for (const pane of panes) expect(pane.getBoundingClientRect().height, layout).toBe(600);
    });
  }
});

describe("Workspace, in a narrow box", () => {
  for (const layout of LAYOUTS) {
    it(`stacks ${layout} into one column of full-width panes, nothing past a 320px edge`, async () => {
      await page.viewport(360, 800);
      const { container } = await render(<Layout layout={layout} width={320} />);
      const workspace = container.querySelector("[data-slot=workspace]") as HTMLElement;
      expect(workspace.scrollWidth, layout).toBeLessThanOrEqual(320);
      const edge = workspace.getBoundingClientRect();
      for (const pane of regions(container)) {
        const box = pane.getBoundingClientRect();
        expect([box.left, box.width], `${layout}: ${pane.dataset.slot}`).toEqual([edge.left, 320]);
      }
      // The panes stack in reading order, one under another.
      const tops = regions(container).map((pane) => pane.getBoundingClientRect().top);
      expect(tops, layout).toEqual([...tops].sort((a, b) => a - b));
      expect(new Set(tops).size, layout).toBe(tops.length);
      // Nothing in them runs past the edge: their controls included.
      for (const control of container.querySelectorAll("button"))
        expect(control.getBoundingClientRect().right, layout).toBeLessThanOrEqual(edge.right);
    });
  }

  it("is accessible and looks right in every mode at 320px", async () => {
    await page.viewport(360, 800);
    const { container } = await render(
      <Stage>
        <Layout layout="three" width={320} />
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("Workspace · 320px");
  });
});
