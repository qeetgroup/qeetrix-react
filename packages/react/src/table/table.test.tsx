import { DownloadIcon } from "@qeetrix/icons/icons/download";
import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Badge } from "../badge/badge";
import { Button, IconButton } from "../button/button";
import { Card } from "../card/card";
import { AvatarItem } from "../experimental/avatar-item/avatar-item";
import { Input } from "../input/input";
import { hi } from "../locales/hi";
import { MenuItem } from "../menu/menu";
import { QeetrixProvider } from "../provider/provider";
import { Table, type TableColumn, type TableProps } from "./table";

const html = document.documentElement;

interface Invoice {
  id: string;
  customer: string;
  status: "Paid" | "Overdue";
  amount: string;
}

const INVOICES: Invoice[] = [
  { id: "INV-0042", customer: "Acme Retail", status: "Paid", amount: "₹1,24,500" },
  { id: "INV-0043", customer: "Bharat Foods", status: "Overdue", amount: "₹8,200" },
  { id: "INV-0044", customer: "Coastal Labs", status: "Paid", amount: "₹56,000" },
];

const COLUMNS: TableColumn<Invoice>[] = [
  { id: "id", header: "Invoice", cell: (row) => row.id, sortable: true },
  { id: "customer", header: "Customer", cell: (row) => row.customer },
  {
    id: "status",
    header: "Status",
    cell: (row) => <Badge tone={row.status === "Paid" ? "success" : "danger"}>{row.status}</Badge>,
  },
  {
    id: "amount",
    header: "Amount",
    cell: (row) => row.amount,
    numeric: true,
    sortable: true,
    sortFirst: "descending",
  },
];

function Invoices(props: Partial<TableProps<Invoice>>) {
  return (
    <Table
      label="Recent invoices"
      rows={INVOICES}
      rowId={(row) => row.id}
      rowLabel={(row) => row.id}
      columns={COLUMNS}
      {...props}
    />
  );
}

const header = (name: string) => page.getByRole("columnheader", { name });
const checkbox = (name: string) => page.getByRole("checkbox", { name });
const live = () => document.querySelector(".qx-table > [aria-live]")?.textContent;

describe("Table", () => {
  it("is a table named by its label, with column headers", async () => {
    await render(<Invoices />);
    await expect.element(page.getByRole("table", { name: "Recent invoices" })).toBeVisible();
    await expect.element(header("Customer")).toHaveAttribute("scope", "col");
    expect(page.getByRole("row").all()).toHaveLength(4);
  });

  it("follows the density: rows 32, 40 and 48px", async () => {
    const { container } = await render(<Invoices />);
    const row = container.querySelector("tbody tr") as HTMLElement;
    const heights: Record<string, number> = {};
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      heights[density] = row.getBoundingClientRect().height;
    }
    delete html.dataset.qxDensity;
    expect(heights).toEqual({ compact: 32, default: 40, comfortable: 48 });
  });

  it("right-aligns numbers in tabular figures", async () => {
    await render(<Invoices />);
    const amount = page.getByRole("cell", { name: "₹1,24,500" }).element();
    expect(getComputedStyle(amount).textAlign).toBe("end");
    expect(getComputedStyle(amount).fontVariantNumeric).toBe("tabular-nums");
  });

  it("sorts one way, the other, then back to the server's order; aria-sort marks it", async () => {
    const onSortChange = vi.fn();
    await render(<Invoices onSortChange={onSortChange} />);
    // Only sortable headers are buttons.
    expect(page.getByRole("button", { name: "Customer" }).query()).toBeNull();
    const invoice = page.getByRole("button", { name: "Invoice" });
    await invoice.click();
    expect(onSortChange).toHaveBeenLastCalledWith({ column: "id", direction: "ascending" });
    await expect.element(header("Invoice")).toHaveAttribute("aria-sort", "ascending");
    await invoice.click();
    await expect.element(header("Invoice")).toHaveAttribute("aria-sort", "descending");
    await invoice.click();
    expect(onSortChange).toHaveBeenLastCalledWith(null);
    await expect.element(header("Invoice")).not.toHaveAttribute("aria-sort");
    // Amounts sort largest first.
    await page.getByRole("button", { name: "Amount" }).click();
    expect(onSortChange).toHaveBeenLastCalledWith({ column: "amount", direction: "descending" });
  });

  it("selects rows, or the whole page from the header, and keeps other pages' rows", async () => {
    const onSelectedChange = vi.fn();
    await render(
      <Invoices selectable defaultSelected={["INV-0001"]} onSelectedChange={onSelectedChange} />,
    );
    await checkbox("Select INV-0043").click();
    expect(onSelectedChange).toHaveBeenLastCalledWith(["INV-0001", "INV-0043"]);
    await expect.element(checkbox("Select all rows")).toHaveAttribute("aria-checked", "mixed");
    const row = page.getByRole("row", { name: /INV-0043/ }).element();
    expect(row.hasAttribute("data-selected")).toBe(true);
    expect(getComputedStyle(row.querySelector("td") as HTMLElement).backgroundColor).toBe(
      tokenColor("--qx-color-bg-selected"),
    );
    await checkbox("Select all rows").click();
    expect(onSelectedChange).toHaveBeenLastCalledWith([
      "INV-0001",
      "INV-0043",
      "INV-0042",
      "INV-0044",
    ]);
    await expect.element(checkbox("Select all rows")).toHaveAttribute("aria-checked", "true");
    await checkbox("Select all rows").click();
    expect(onSelectedChange).toHaveBeenLastCalledWith(["INV-0001"]);
  });

  it("swaps the toolbar for a bar with the count, bulk actions and Clear while rows are selected", async () => {
    const bulk = vi.fn();
    await render(
      <Invoices
        selectable
        toolbar={<input aria-label="Search invoices" />}
        bulkActions={(ids) => (
          <Button size="sm" variant="soft" onClick={() => bulk(ids)}>
            Send reminder
          </Button>
        )}
      />,
    );
    await expect.element(page.getByRole("textbox", { name: "Search invoices" })).toBeVisible();
    await checkbox("Select INV-0042").click();
    await checkbox("Select INV-0043").click();
    await expect
      .poll(() => document.querySelector(".qx-table-count")?.textContent)
      .toBe("2 selected");
    expect(live()).toBe("2 selected");
    expect(page.getByRole("textbox", { name: "Search invoices" }).query()).toBeNull();
    await page.getByRole("button", { name: "Send reminder" }).click();
    expect(bulk).toHaveBeenCalledWith(["INV-0042", "INV-0043"]);
    await page.getByRole("button", { name: "Clear selection" }).click();
    await expect.element(page.getByRole("textbox", { name: "Search invoices" })).toBeVisible();
    await expect.element(checkbox("Select all rows")).toHaveFocus();
  });

  it("puts each row's actions in a menu named for the row", async () => {
    const onClick = vi.fn();
    await render(
      <Invoices rowActions={(row) => <MenuItem onClick={() => onClick(row.id)}>Void</MenuItem>} />,
    );
    await page.getByRole("button", { name: "Actions for INV-0043" }).click();
    await page.getByRole("menuitem", { name: "Void" }).click();
    expect(onClick).toHaveBeenCalledWith("INV-0043");
  });

  it("shows loading, empty and error states under the header", async () => {
    const { rerender, container } = await render(<Invoices rows={[]} loading />);
    await expect.element(page.getByRole("table")).toHaveAttribute("aria-busy", "true");
    expect(container.querySelectorAll("tbody tr[aria-hidden]")).toHaveLength(5);
    expect(live()).toBe("Loading");

    await rerender(<Invoices loading />);
    expect(container.querySelector(".qx-table")?.hasAttribute("data-loading")).toBe(true);

    await rerender(<Invoices rows={[]} />);
    await expect.element(page.getByRole("cell", { name: "No results" })).toBeVisible();
    await rerender(<Invoices rows={[]} empty="No invoices yet" />);
    await expect.element(page.getByRole("cell", { name: "No invoices yet" })).toBeVisible();
    await rerender(<Invoices error="Invoices couldn't load" />);
    await expect.element(page.getByRole("cell", { name: "Invoices couldn't load" })).toBeVisible();
    expect(page.getByRole("cell", { name: "INV-0042" }).query()).toBeNull();
  });

  it("speaks Hindi through QeetrixProvider", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <Invoices selectable rowActions={() => <MenuItem>Void</MenuItem>} />
      </QeetrixProvider>,
    );
    await expect.element(checkbox("सभी पंक्तियाँ चुनें")).toBeVisible();
    await expect.element(checkbox("INV-0042 चुनें")).toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "INV-0042 के लिए कार्रवाइयाँ" }))
      .toBeVisible();
  });

  it("centres every control in its row, and keeps two-line cells off the lines", async () => {
    await render(
      <Invoices
        selectable
        rowActions={() => <MenuItem>Void</MenuItem>}
        columns={[
          {
            id: "customer",
            header: "Customer",
            cell: (row) => <AvatarItem name={row.customer} description={row.id} />,
          },
          ...COLUMNS.slice(2),
        ]}
      />,
    );
    const row = page.getByRole("row", { name: /Acme Retail/ }).element();
    const middle = (element: Element | null) => {
      const rect = (element as HTMLElement).getBoundingClientRect();
      return rect.top + rect.height / 2;
    };
    const centre = middle(row);
    for (const selector of [".qx-checkbox", "[data-slot=avatar]", ".qx-table-actions button"]) {
      // Within half a pixel: the same pixel, wherever a browser rounds the row.
      expect(Math.abs(middle(row.querySelector(selector)) - centre), selector).toBeLessThanOrEqual(
        0.5,
      );
    }
    // The two lines keep the cells' padding above and below.
    const avatar = (row.querySelector("[data-slot=avatar]") as HTMLElement).getBoundingClientRect();
    expect(avatar.top - row.getBoundingClientRect().top).toBeGreaterThanOrEqual(4);
  });

  it("in a Card, lines its toolbar up with its columns, in a band above the header", async () => {
    await page.viewport(800, 400);
    await render(
      <Card>
        <Invoices
          selectable
          rowActions={() => <MenuItem>Void</MenuItem>}
          toolbar={
            // Fields at the start, tools at the end, as a console toolbar lays them out.
            <div style={{ display: "flex", flex: 1, justifyContent: "space-between" }}>
              <Input aria-label="Search invoices" style={{ inlineSize: 240 }} />
              <IconButton icon={DownloadIcon} aria-label="Download" tone="neutral" size="lg" />
            </div>
          }
        />
      </Card>,
    );
    const box = (selector: string) =>
      (document.querySelector(selector) as HTMLElement).getBoundingClientRect();
    const centre = (rect: DOMRect) => rect.left + rect.width / 2;
    // On the same pixel: WebKit lays tables out in 1/64px, so exact equality is too strict.
    const same = (a: number, b: number, density: string) =>
      expect(Math.abs(a - b), `${density}: ${a} vs ${b}`).toBeLessThan(0.5);
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      const bar = box(".qx-table-bar");
      const field = box(".qx-table-bar .qx-input");
      // Equal room above and below the controls, and the header straight after.
      same(field.top - bar.top, bar.bottom - field.bottom, density);
      same(box("thead tr").top, bar.bottom, density);
      // The first control starts at the checkboxes' edge; the last icon is centred on the row menus.
      same(field.left, box("tbody .qx-checkbox").left, density);
      same(
        centre(box(".qx-table-bar .qx-icon-button")),
        centre(box("tbody .qx-table-actions .qx-icon-button")),
        density,
      );
    }
    delete html.dataset.qxDensity;
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <div style={{ inlineSize: 560 }}>
          <Invoices
            selectable
            defaultSelected={["INV-0043"]}
            defaultSort={{ column: "amount", direction: "descending" }}
            bulkActions={() => (
              <Button size="sm" variant="soft">
                Send reminder
              </Button>
            )}
            rowActions={() => <MenuItem>Void</MenuItem>}
          />
        </div>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("Table");
  });

  it("looks right loading and empty", async () => {
    await render(
      <Stage>
        <div style={{ display: "grid", gap: 24, inlineSize: 560 }}>
          <Invoices rows={[]} loading loadingRows={3} />
          <Invoices rows={[]} />
        </div>
      </Stage>,
    );
    await screenshotEveryMode("Table · loading and empty");
  });
});
