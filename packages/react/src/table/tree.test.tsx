import { useState } from "react";
import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Checkbox } from "../checkbox/checkbox";
import { Table, type TableColumn } from "./table";
import { foldTreeRows } from "./tree";

interface Group {
  id: string;
  name: string;
  depth: number;
  parent?: string;
  members: number;
  children?: boolean;
}

const GROUPS: Group[] = [
  { id: "eng", name: "Engineering", depth: 0, members: 42, children: true },
  { id: "id", name: "Identity", depth: 1, members: 12, children: true },
  { id: "passkeys", name: "Passkeys", depth: 2, members: 5 },
  { id: "pay", name: "Payments", depth: 1, members: 9 },
  { id: "fin", name: "Finance", depth: 0, members: 8 },
];

const COLUMNS: TableColumn<Group>[] = [
  { id: "name", header: "Group", cell: (row) => row.name },
  { id: "members", header: "Members", cell: (row) => row.members, numeric: true },
];

function Groups({ defaultExpanded = ["eng"] }: { defaultExpanded?: string[] }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <Table
      label="Groups"
      rows={GROUPS}
      rowId={(row) => row.id}
      rowLabel={(row) => row.name}
      columns={COLUMNS}
      rowDepth={(row) => row.depth}
      rowHasChildren={(row) => row.children === true}
      expanded={expanded}
      onExpandedChange={setExpanded}
      rowHref={(row) => `#group-${row.id}`}
    />
  );
}

const names = () =>
  [...document.querySelectorAll("[data-slot=table-row-link]")].map((link) => link.textContent);

describe("Table tree rows", () => {
  it("folds the rows inside a closed row, and is a tree grid with levels and places", async () => {
    await render(<Groups />);
    await expect.element(page.getByRole("treegrid", { name: "Groups" })).toBeVisible();
    expect(names()).toEqual(["Engineering", "Identity", "Payments", "Finance"]);
    const rows = [...document.querySelectorAll("tbody tr")];
    const [eng, identity, payments, finance] = rows;
    expect(eng?.getAttribute("aria-level")).toBe("1");
    expect(eng?.getAttribute("aria-expanded")).toBe("true");
    expect(identity?.getAttribute("aria-level")).toBe("2");
    expect(identity?.getAttribute("aria-expanded")).toBe("false");
    expect([
      payments?.getAttribute("aria-posinset"),
      payments?.getAttribute("aria-setsize"),
    ]).toEqual(["2", "2"]);
    expect(finance?.getAttribute("aria-posinset")).toBe("2");
    expect(finance?.hasAttribute("aria-expanded")).toBe(false);
  });

  it("opens and folds with its button, outside the row's link, which still opens the group", async () => {
    await render(<Groups />);
    await userEvent.click(page.getByRole("button", { name: "Expand Identity" }));
    expect(names()).toEqual(["Engineering", "Identity", "Passkeys", "Payments", "Finance"]);
    expect(window.location.hash).toBe("");
    const link = page.getByRole("link", { name: "Passkeys" }).element() as HTMLElement;
    const passkeys = link.closest("[data-slot=table-tree]") as HTMLElement;
    const engineering = page.getByRole("link", { name: "Engineering" }).element() as HTMLElement;
    expect(link.getBoundingClientRect().left).toBeGreaterThan(
      engineering.getBoundingClientRect().left + 30,
    );
    expect(passkeys.querySelector("[data-slot=table-fold]")).toBeNull();
    await userEvent.click(page.getByRole("button", { name: "Collapse Engineering" }));
    expect(names()).toEqual(["Engineering", "Finance"]);
    await userEvent.click(page.getByRole("gridcell", { name: "8" }));
    expect(window.location.hash).toBe("#group-fin");
    window.location.hash = "";
  });

  it("folds with ←, opens with →, and moves between rows with ↑ and ↓", async () => {
    await render(<Groups />);
    page.getByRole("link", { name: "Identity" }).element().focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(names()).toContain("Passkeys");
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(page.getByRole("link", { name: "Passkeys" })).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(page.getByRole("link", { name: "Identity" })).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(names()).not.toContain("Passkeys");
    await userEvent.keyboard("{ArrowUp}");
    await expect.element(page.getByRole("link", { name: "Engineering" })).toHaveFocus();
  });

  it("says where the page's first row continues from", async () => {
    await render(
      <Table
        label="Groups"
        rows={GROUPS.slice(2)}
        rowId={(row) => row.id}
        rowLabel={(row) => row.name}
        columns={COLUMNS}
        rowDepth={(row) => row.depth}
        rowPath={(row) => (row.depth === 2 ? "Engineering › Identity" : "Engineering")}
      />,
    );
    await expect.element(page.getByText("Continued · Engineering › Identity")).toBeVisible();
    expect(page.getByText(/^Continued/).elements()).toHaveLength(1);
  });

  it("pages the rows that show with foldTreeRows", () => {
    const shown = foldTreeRows(GROUPS, {
      rowId: (row) => row.id,
      rowDepth: (row) => row.depth,
      rowHasChildren: (row) => row.children === true,
      expanded: [],
    });
    expect(shown.map((row) => row.id)).toEqual(["eng", "fin"]);
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <div style={{ inlineSize: 480 }}>
          <Groups defaultExpanded={["eng", "id"]} />
        </div>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("Table · tree");
  });
});

interface Permission {
  id: string;
  name: string;
  admin: boolean;
  member: boolean;
}

const PERMISSIONS: Permission[] = [
  { id: "users.read", name: "users.read", admin: true, member: true },
  { id: "users.write", name: "users.write", admin: true, member: false },
];

describe("Table matrix", () => {
  it("keeps its first column while it scrolls sideways, with link headers and centred controls", async () => {
    const roles = ["admin", "member", "auditor", "billing", "support", "owner", "viewer"];
    const { container } = await render(
      <div style={{ inlineSize: 360 }}>
        <Table
          label="Permissions by role"
          stickyFirstColumn
          rows={PERMISSIONS}
          rowId={(row) => row.id}
          rowLabel={(row) => row.name}
          columns={[
            { id: "name", header: "Permission", cell: (row) => <code>{row.name}</code> },
            ...roles.map((role) => ({
              id: role,
              align: "center" as const,
              width: 120,
              header: <a href={`#role-${role}`}>{role}</a>,
              cell: (row: Permission) => (
                <Checkbox
                  aria-label={`${row.name} for ${role}`}
                  defaultChecked={
                    role === "admin" ? row.admin : role === "member" ? row.member : false
                  }
                />
              ),
            })),
          ]}
        />
      </div>,
    );
    const scroll = container.querySelector("[data-slot=table-scroll]") as HTMLElement;
    await expect.element(page.getByRole("region", { name: "Permissions by role" })).toBeVisible();
    const first = page.getByRole("cell", { name: "users.read" }).element() as HTMLElement;
    const before = first.getBoundingClientRect().left;
    scroll.scrollLeft = 200;
    await expect.poll(() => first.getBoundingClientRect().left).toBe(before);
    const header = page.getByRole("link", { name: "admin" }).element() as HTMLElement;
    const th = header.closest("th") as HTMLElement;
    expect(getComputedStyle(header).fontWeight).toBe(getComputedStyle(th).fontWeight);
    expect(getComputedStyle(header).textDecorationLine).toBe("none");
    scroll.scrollLeft = 0;
    const box = page
      .getByRole("checkbox", { name: "users.read for admin" })
      .element()
      .getBoundingClientRect();
    const cell = (
      page
        .getByRole("checkbox", { name: "users.read for admin" })
        .element()
        .closest("td") as HTMLElement
    ).getBoundingClientRect();
    expect(Math.abs(box.left + box.width / 2 - (cell.left + cell.width / 2))).toBeLessThan(1);
    await expectAccessible(container);
  });
});
