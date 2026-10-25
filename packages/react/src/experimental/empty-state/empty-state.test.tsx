import { UsersIcon } from "@qeetrix/icons/icons/users";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tab } from "../../../tests/support/keyboard";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { Button } from "../../button/button";
import { Link } from "../../link/link";
import { Stack } from "../../stack/stack";
import { DataState } from "./data-state";
import { EmptyState } from "./empty-state";

const DENSITIES = ["compact", "default", "comfortable"] as const;
const rect = (element: Element | null) => (element as HTMLElement).getBoundingClientRect();

const empty = (
  <EmptyState
    icon={UsersIcon}
    title="No users yet"
    description="Invite your team, or connect a directory to sync them."
    actions={<Button>Invite users</Button>}
  />
);

describe("EmptyState", () => {
  it("shows a decorative icon, the title, the description and its actions", async () => {
    const { container } = await render(empty);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    await expect.element(page.getByText("No users yet")).toBeVisible();
    await expect.element(page.getByRole("button", { name: "Invite users" })).toBeVisible();
    expect(page.getByRole("heading").elements()).toHaveLength(0);
  });

  it("makes the title a heading at the level given", async () => {
    await render(<EmptyState title="No users yet" level={2} />);
    await expect
      .element(page.getByRole("heading", { level: 2, name: "No users yet" }))
      .toBeVisible();
  });

  it("renders its children under the actions, in small subtle text", async () => {
    // Regression: children were allowed by the type but dropped.
    const { container } = await render(
      <EmptyState
        title="No users yet"
        actions={<Button>Invite users</Button>}
        style={{ inlineSize: 480 }}
      >
        Or <Link href="/import">import users from a CSV file</Link>.
      </EmptyState>,
    );
    const footer = container.querySelector("[data-slot=empty-state-footer]") as HTMLElement;
    await expect
      .element(page.getByRole("link", { name: "import users from a CSV file" }))
      .toBeVisible();
    expect(footer.textContent).toBe("Or import users from a CSV file.");
    expect(rect(footer).top).toBeGreaterThanOrEqual(
      rect(container.querySelector("[data-slot=empty-state-actions]")).bottom,
    );
    const style = getComputedStyle(footer);
    expect(style.fontSize).toBe("12px");
    expect(style.fontVariationSettings).toBe('"GEOM" 0');
  });

  it("adds no footer for children that render nothing", async () => {
    const { container } = await render(<EmptyState title="No users yet">{false}</EmptyState>);
    expect(container.querySelector("[data-slot=empty-state-footer]")).toBeNull();
  });

  it("keeps the heading letterforms on a section's smaller title", async () => {
    // Regression: the section size set the `font` shorthand after the geometry, which reset it.
    const { container } = await render(
      <>
        <EmptyState title="No users yet" />
        <EmptyState title="No invoices" size="section" />
      </>,
    );
    const titles = [...container.querySelectorAll<HTMLElement>("[data-slot=empty-state-title]")];
    expect(titles.map((title) => getComputedStyle(title).fontSize)).toEqual(["18px", "16px"]);
    for (const title of titles) {
      expect(getComputedStyle(title).fontVariationSettings).toBe('"GEOM" 50');
    }
  });
});

describe("DataState", () => {
  it("shows a labelled spinner while loading, in a busy region", async () => {
    const { container } = await render(<DataState loading>content</DataState>);
    await expect.element(page.getByRole("status", { name: "Loading" })).toBeVisible();
    expect(container.querySelector("[aria-busy=true]")).not.toBeNull();
  });

  it("shows a generic error with Try again, never the raw error", async () => {
    const onRetry = vi.fn();
    await render(
      <DataState
        error={new Error("SQLSTATE 42P01 relation users does not exist")}
        onRetry={onRetry}
      >
        content
      </DataState>,
    );
    await expect.element(page.getByText("Couldn't load this")).toBeVisible();
    expect(document.body.textContent).not.toContain("SQLSTATE");
    await page.getByRole("button", { name: "Try again" }).click();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("shows its empty state when empty, and the content otherwise", async () => {
    const screen = await render(
      <DataState empty emptyState={empty}>
        <p>Priya Sharma</p>
      </DataState>,
    );
    await expect.element(page.getByText("No users yet")).toBeVisible();
    await screen.rerender(
      <DataState empty={false} emptyState={empty}>
        <p>Priya Sharma</p>
      </DataState>,
    );
    await expect.element(page.getByText("Priya Sharma")).toBeVisible();
  });

  it("puts className, ref and the other props on each region it draws, with a data-slot", async () => {
    const ref = createRef<HTMLDivElement>();
    const props = { className: "invoices", id: "invoices", ref, "data-testid": "invoices" };
    const screen = await render(<DataState {...props} loading />);
    const region = () => document.getElementById("invoices") as HTMLElement;
    for (const [state, element] of [
      ["loading", <DataState key="l" {...props} loading />],
      ["error", <DataState key="e" {...props} error />],
      ["empty", <DataState key="m" {...props} empty emptyState={empty} />],
    ] as const) {
      await screen.rerender(element);
      expect(region().dataset.slot, state).toBe("data-state");
      expect(region().dataset.state, state).toBe(state);
      expect(region().className, state).toBe("qx-data-state invoices");
      expect(region().dataset.testid, state).toBe("invoices");
      expect(ref.current, state).toBe(region());
    }
    // The content is the caller's own, with no wrapper.
    await screen.rerender(
      <DataState {...props}>
        <p data-testid="content">Priya Sharma</p>
      </DataState>,
    );
    expect(document.getElementById("invoices")).toBeNull();
    expect(screen.container.firstElementChild?.tagName).toBe("P");
  });

  it("announces a failed load: the error region appears as an alert", async () => {
    const screen = await render(<DataState loading onRetry={() => {}} />);
    const loading = document.querySelector("[data-slot=data-state]");
    expect(page.getByRole("alert").elements()).toHaveLength(0);
    await screen.rerender(<DataState error onRetry={() => {}} />);
    const alert = page.getByRole("alert");
    await expect.element(alert).toBeVisible();
    expect(alert.element().textContent).toContain("Couldn't load this");
    // A new element, not the loading region relabelled: screen readers announce an alert that
    // appears, not one whose role changes.
    expect(alert.element()).not.toBe(loading);
  });

  it("keeps the unseen error state out of reach while loading", async () => {
    await render(
      <>
        <button type="button">Before</button>
        <DataState loading onRetry={() => {}} />
        <button type="button">After</button>
      </>,
    );
    await page.getByRole("button", { name: "Before" }).click();
    await tab();
    expect(document.activeElement?.textContent).toBe("After");
    expect(page.getByRole("button", { name: "Try again" }).elements()).toHaveLength(0);
    await expect.element(page.getByRole("status", { name: "Loading" })).toBeVisible();
  });

  it("holds its height from loading to error, at every density and width", async () => {
    // Regression: loading was 116px and the error 184px, so the page jumped when a load failed.
    const html = document.documentElement;
    for (const density of DENSITIES) {
      html.dataset.qxDensity = density;
      for (const width of [480, 280]) {
        for (const retry of [{ onRetry: () => {} }, {}]) {
          const frame = (node: React.ReactNode) => <div style={{ inlineSize: width }}>{node}</div>;
          const screen = await render(frame(<DataState loading {...retry} />));
          const loading = rect(document.querySelector("[data-slot=data-state]"));
          await screen.rerender(frame(<DataState error {...retry} />));
          const failed = rect(document.querySelector("[data-slot=data-state]"));
          const which = `${density} ${width}px ${"onRetry" in retry ? "with" : "without"} retry`;
          expect(Math.abs(failed.height - loading.height), which).toBeLessThanOrEqual(0.5);
          expect(failed.width, which).toBe(loading.width);
          // The spinner sits in the middle of the region.
          await screen.rerender(frame(<DataState loading {...retry} />));
          const spinner = rect(document.querySelector("[data-slot=spinner]"));
          const region = rect(document.querySelector("[data-slot=data-state]"));
          const middle = (r: DOMRect) => r.top + r.height / 2;
          expect(Math.abs(middle(spinner) - middle(region)), which).toBeLessThanOrEqual(0.5);
          await screen.unmount();
        }
      }
    }
    delete html.dataset.qxDensity;
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <Stack gap="lg" style={{ inlineSize: 480 }}>
          {empty}
          <DataState error="x" onRetry={() => {}} />
        </Stack>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("EmptyState");
  });

  it("is accessible and looks right with a footer, and loading at the error's height", async () => {
    const { container } = await render(
      <Stage>
        <EmptyState
          icon={UsersIcon}
          title="No users yet"
          description="Invite your team, or connect a directory to sync them."
          actions={<Button>Invite users</Button>}
          style={{ inlineSize: 400 }}
        >
          Or <Link href="/import">import users from a CSV file</Link>.
        </EmptyState>
        <div style={{ display: "flex", gap: 16, inlineSize: 760 }}>
          {[true, false].map((loading) => (
            <div
              key={String(loading)}
              style={{ flex: 1, outline: "1px dashed var(--qx-color-border-default)" }}
            >
              <DataState loading={loading} error onRetry={() => {}} />
            </div>
          ))}
        </div>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("EmptyState · footer and loading");
  });
});
