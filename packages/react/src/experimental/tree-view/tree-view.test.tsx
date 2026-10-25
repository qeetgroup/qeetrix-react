import { DirectionProvider } from "@base-ui/react/direction-provider";
import { BuildingIcon } from "@qeetrix/icons/icons/building";
import { UserGroupIcon } from "@qeetrix/icons/icons/user-group";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { Card } from "../../card/card";
import { type TreeNode, TreeView } from "./tree-view";

const UNITS: TreeNode[] = [
  {
    id: "acme",
    label: "Acme Pvt Ltd",
    icon: BuildingIcon,
    meta: "1,284",
    children: [
      {
        id: "eng",
        label: "Engineering",
        icon: UserGroupIcon,
        meta: "412",
        children: [
          { id: "platform", label: "Platform", icon: UserGroupIcon, meta: "96" },
          { id: "mobile", label: "Mobile", icon: UserGroupIcon, meta: "58" },
        ],
      },
      { id: "fin", label: "Finance", icon: UserGroupIcon, meta: "74" },
      {
        id: "sales",
        label: "Sales",
        icon: UserGroupIcon,
        meta: "203",
        children: [{ id: "north", label: "North", meta: "88" }],
      },
    ],
  },
];
const PERMISSIONS: TreeNode[] = [
  {
    id: "users",
    label: "Users",
    children: [
      { id: "users.view", label: "View users" },
      { id: "users.mfa", label: "Reset MFA" },
      { id: "users.delete", label: "Delete users" },
    ],
  },
  {
    id: "apps",
    label: "Applications",
    children: [{ id: "apps.view", label: "View applications" }],
  },
  { id: "audit", label: "Audit log" },
];

const item = (name: string) => page.getByRole("treeitem", { name: new RegExp(`^${name}`) });
const focused = () => (document.activeElement as HTMLElement | null)?.dataset.id;

describe("TreeView", () => {
  it("is a tree of treeitems with their level, place and open state", async () => {
    await render(<TreeView label="Organisation units" items={UNITS} defaultExpanded={["acme"]} />);
    await expect.element(page.getByRole("tree", { name: "Organisation units" })).toBeVisible();
    const engineering = item("Engineering");
    await expect.element(engineering).toHaveAttribute("aria-level", "2");
    await expect.element(engineering).toHaveAttribute("aria-posinset", "1");
    await expect.element(engineering).toHaveAttribute("aria-setsize", "3");
    await expect.element(engineering).toHaveAttribute("aria-expanded", "false");
    expect(item("Finance").element().hasAttribute("aria-expanded")).toBe(false);
    expect(document.querySelectorAll('[role="treeitem"][tabindex="0"]')).toHaveLength(1);
  });

  it("moves with the arrows: Right opens and steps in, Left closes and steps out", async () => {
    await render(<TreeView label="Organisation units" items={UNITS} defaultExpanded={["acme"]} />);
    (item("Acme Pvt Ltd").element() as HTMLElement).focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(focused()).toBe("eng");
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(item("Engineering")).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{ArrowRight}");
    expect(focused()).toBe("platform");
    await userEvent.keyboard("{ArrowLeft}");
    expect(focused()).toBe("eng");
    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(item("Engineering")).toHaveAttribute("aria-expanded", "false");
    await userEvent.keyboard("{End}");
    expect(focused()).toBe("sales");
    await userEvent.keyboard("{Home}");
    expect(focused()).toBe("acme");
    // Type a letter: the next node that starts with it.
    await userEvent.keyboard("f");
    expect(focused()).toBe("fin");
  });

  it("mirrors Left and Right right-to-left", async () => {
    await render(
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <TreeView label="Organisation units" items={UNITS} defaultExpanded={["acme"]} />
        </div>
      </DirectionProvider>,
    );
    (item("Engineering").element() as HTMLElement).focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(item("Engineering")).toHaveAttribute("aria-expanded", "true");
  });

  it("selects a node by Enter or click, and the chevron opens it without selecting", async () => {
    const onSelectedChange = vi.fn();
    await render(
      <TreeView
        label="Organisation units"
        items={UNITS}
        defaultExpanded={["acme"]}
        onSelectedChange={onSelectedChange}
      />,
    );
    (item("Finance").element() as HTMLElement).focus();
    await userEvent.keyboard("{Enter}");
    expect(onSelectedChange).toHaveBeenLastCalledWith("fin");
    await expect.element(item("Finance")).toHaveAttribute("aria-selected", "true");
    const row = item("Finance").element().querySelector(".qx-tree-row") as HTMLElement;
    expect(getComputedStyle(row).backgroundColor).toBe(tokenColor("--qx-color-bg-selected"));
    await (item("Sales").element().querySelector(".qx-tree-toggle") as HTMLElement).click();
    await expect.element(item("Sales")).toHaveAttribute("aria-expanded", "true");
    expect(onSelectedChange).toHaveBeenCalledTimes(1);
    await page.getByText("North").click();
    expect(onSelectedChange).toHaveBeenLastCalledWith("north");
  });

  it("ticks with checkboxes: a parent ticks all its nodes, and is mixed while some are on", async () => {
    const onCheckedChange = vi.fn();
    await render(
      <TreeView
        label="Permissions"
        items={PERMISSIONS}
        checkable
        defaultExpanded={["users"]}
        defaultChecked={["users.view", "users.mfa", "audit"]}
        onCheckedChange={onCheckedChange}
      />,
    );
    await expect.element(page.getByRole("tree")).toHaveAttribute("aria-multiselectable", "true");
    await expect.element(item("Users")).toHaveAttribute("aria-checked", "mixed");
    await expect.element(item("Audit log")).toHaveAttribute("aria-checked", "true");
    await expect.element(item("Applications")).toHaveAttribute("aria-checked", "false");
    (item("Delete users").element() as HTMLElement).focus();
    await userEvent.keyboard(" ");
    await expect.element(item("Users")).toHaveAttribute("aria-checked", "true");
    (item("Users").element() as HTMLElement).focus();
    await userEvent.keyboard(" ");
    await expect.element(item("View users")).toHaveAttribute("aria-checked", "false");
    expect(onCheckedChange).toHaveBeenLastCalledWith(["audit"]);
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(900, 420);
    const { container } = await render(
      <div
        data-qx-stage=""
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          alignItems: "start",
          padding: 16,
          inlineSize: 860,
          background: "var(--qx-color-surface-canvas)",
        }}
      >
        <Card title="Organisation units" level={2}>
          <TreeView
            label="Organisation units"
            items={UNITS}
            defaultExpanded={["acme", "eng"]}
            defaultSelected="platform"
          />
        </Card>
        <Card title="Role: Support agent" level={2}>
          <TreeView
            label="Permissions"
            items={PERMISSIONS}
            checkable
            defaultExpanded={["users"]}
            defaultChecked={["users.view", "users.mfa", "audit"]}
          />
        </Card>
      </div>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("TreeView", "[data-qx-stage]");
  });
});
