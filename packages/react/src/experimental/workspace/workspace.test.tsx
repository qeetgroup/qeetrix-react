import { useState } from "react";
import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { Button } from "../../button/button";
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
  Workspace,
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
    await userEvent.keyboard("{Tab}");
    await expect.element(page.getByRole("button", { name: "Undo" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(page.getByRole("button", { name: "Redo" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(page.getByRole("button", { name: "Run test" })).toHaveFocus();
    await userEvent.keyboard("{Tab}");
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
    const panes = [...container.querySelectorAll<HTMLElement>("[data-slot=workspace] > *")];
    const lefts = panes.map((pane) => Math.round(pane.getBoundingClientRect().left));
    expect(new Set(lefts).size).toBe(1);
    expect(panes[1]?.getBoundingClientRect().top).toBeGreaterThan(
      panes[0]?.getBoundingClientRect().top ?? 0,
    );
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
