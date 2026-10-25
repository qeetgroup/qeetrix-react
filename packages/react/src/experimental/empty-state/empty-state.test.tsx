import { UsersIcon } from "@qeetrix/icons/icons/users";
import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { Button } from "../../button/button";
import { Stack } from "../../stack/stack";
import { DataState } from "./data-state";
import { EmptyState } from "./empty-state";

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
});
