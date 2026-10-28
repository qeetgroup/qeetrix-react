import { FileTextIcon } from "@qeetrix/icons/icons/file-text";
import { UsersIcon } from "@qeetrix/icons/icons/users";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { GraphCanvas, type GraphNode } from "./graph";

const NODES: GraphNode[] = [
  { id: "doc", label: "Q3 plan", meta: "document", icon: FileTextIcon },
  {
    id: "eng",
    label: "Engineering",
    meta: "12 members",
    icon: UsersIcon,
    parent: "doc",
    relation: "editor",
  },
  {
    id: "fin",
    label: "Finance",
    meta: "4 members",
    icon: UsersIcon,
    parent: "doc",
    relation: "viewer",
  },
  {
    id: "idt",
    label: "Identity",
    meta: "5 members",
    icon: UsersIcon,
    parent: "eng",
    relation: "member",
  },
];

const node = (name: RegExp) => page.getByRole("button", { name });

describe("GraphCanvas", () => {
  it("lays the tree out top down: each parent centred over its children", async () => {
    await render(
      <div style={{ inlineSize: 600, blockSize: 360, display: "flex" }}>
        <GraphCanvas nodes={NODES} aria-label="Who can read Q3 plan" />
      </div>,
    );
    await expect.element(page.getByRole("figure", { name: "Who can read Q3 plan" })).toBeVisible();
    const box = (name: RegExp) => node(name).element().getBoundingClientRect();
    const doc = box(/^Q3 plan/);
    const eng = box(/^Engineering/);
    const fin = box(/^Finance/);
    expect(eng.top).toBeGreaterThan(doc.bottom);
    expect(Math.round(eng.top)).toBe(Math.round(fin.top));
    expect(Math.round(doc.left + doc.width / 2)).toBe(Math.round((eng.left + fin.right) / 2));
    expect(box(/^Identity/).top).toBeGreaterThan(eng.bottom);
  });

  it("says what each node is reached from, so it reads without seeing it", async () => {
    await render(<GraphCanvas nodes={NODES} aria-label="Access" />);
    await expect
      .element(node(/^Engineering/))
      .toHaveAccessibleName(/^Engineering 12 members ?, editor of Q3 plan$/);
    await expect.element(node(/^Q3 plan/)).toHaveAccessibleName("Q3 plan document");
  });

  it("is one Tab stop; the arrow keys walk the tree and Enter chooses", async () => {
    const onSelect = vi.fn();
    await render(<GraphCanvas nodes={NODES} aria-label="Access" onSelect={onSelect} />);
    await userEvent.keyboard("{Tab}{Tab}{Tab}{Tab}");
    await expect.element(node(/^Q3 plan/)).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(node(/^Engineering/)).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(node(/^Finance/)).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}{ArrowDown}");
    await expect.element(node(/^Identity/)).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}{Enter}");
    expect(onSelect).toHaveBeenCalledWith("eng");
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement?.closest("[data-slot=graph]")).toBeNull();
  });

  it("zooms in steps and fits the frame", async () => {
    const { container } = await render(
      <div style={{ inlineSize: 200, blockSize: 360, display: "flex" }}>
        <GraphCanvas nodes={NODES} aria-label="Access" />
      </div>,
    );
    const figure = container.querySelector("figure") as HTMLElement;
    await userEvent.click(page.getByRole("button", { name: "Zoom out" }));
    expect(figure.style.transform).toBe("scale(0.8)");
    await userEvent.click(page.getByRole("button", { name: "Fit to view" }));
    expect(Number(/scale\((.+)\)/.exec(figure.style.transform)?.[1])).toBeLessThan(0.8);
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <div style={{ inlineSize: 520, blockSize: 320, display: "flex" }}>
          <GraphCanvas nodes={NODES} aria-label="Access" selected="eng" />
        </div>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("GraphCanvas");
  });
});
