import { DownloadIcon } from "@qeetrix/icons/icons/download";
import type { ComponentProps, MouseEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { page, server, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
import { tab } from "../../tests/support/keyboard";
import { canEmulateMedia, emulateMedia, systemColor } from "../../tests/support/media";
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
const regions = () => [...document.querySelectorAll(".qx-table > [aria-live]")];
/** The polite region that announces loading. */
const live = () => regions()[0]?.textContent;
/** The polite region that announces the selection count. */
const liveCount = () => regions()[1]?.textContent;
const DENSITIES = ["compact", "default", "comfortable"] as const;
const box = (selector: string) =>
  (document.querySelector(selector) as HTMLElement).getBoundingClientRect();

/** A router's link: it takes `to`, and navigates on a plain click without reloading the page. */
const navigate = vi.fn();
function RouterLink({ to, onClick, ...props }: ComponentProps<"a"> & { to: string }) {
  return (
    <a
      {...props}
      href={to}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        event.preventDefault();
        navigate(to, { ctrlKey: event.ctrlKey, metaKey: event.metaKey });
      }}
    />
  );
}
afterEach(() => {
  navigate.mockClear();
});

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
    const barHeight = () =>
      (document.querySelector("[data-slot=table-bar]") as HTMLElement).getBoundingClientRect()
        .height;
    const toolbarHeight = barHeight();
    await checkbox("Select INV-0042").click();
    await checkbox("Select INV-0043").click();
    await expect
      .poll(() => document.querySelector(".qx-table-count")?.textContent)
      .toBe("2 selected");
    // The same height on one line, so the header doesn't jump when the first row is ticked.
    expect(barHeight()).toBe(toolbarHeight);
    expect(liveCount()).toBe("2 selected");
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

  it("lets its toolbar fill the bar, so a search and filters use the table's width", async () => {
    await page.viewport(800, 400);
    await render(
      <Invoices
        toolbar={
          <>
            <Input aria-label="Search invoices" style={{ flex: 1 }} />
            <IconButton icon={DownloadIcon} aria-label="Download" tone="neutral" size="lg" />
          </>
        }
      />,
    );
    const bar = (document.querySelector(".qx-table-bar") as HTMLElement).getBoundingClientRect();
    const toolbar = document.querySelector("[data-slot=table-toolbar]") as HTMLElement;
    expect(toolbar.getBoundingClientRect().width).toBe(bar.width);
    const download = page.getByRole("button", { name: "Download" }).element();
    expect(Math.round(download.getBoundingClientRect().right)).toBe(Math.round(bar.right));
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

  it("keeps rows readable while it refreshes: a busy line on the header's foot, nothing moves", async () => {
    const { container, rerender } = await render(
      <Stage>
        <div style={{ inlineSize: 560 }}>
          <Invoices selectable rowActions={() => <MenuItem>Void</MenuItem>} />
        </div>
      </Stage>,
    );
    const before: Record<string, number> = {};
    for (const density of DENSITIES) {
      html.dataset.qxDensity = density;
      before[density] = box("tbody tr").top;
    }
    await rerender(
      <Stage>
        <div style={{ inlineSize: 560 }}>
          <Invoices selectable rowActions={() => <MenuItem>Void</MenuItem>} loading />
        </div>
      </Stage>,
    );
    await expect.element(page.getByRole("table")).toHaveAttribute("aria-busy", "true");
    // Dimming the rows to the disabled opacity failed contrast (text 2.67:1, Badge 1.7:1).
    for (const element of container.querySelectorAll("tbody, tbody tr, tbody td")) {
      expect(getComputedStyle(element).opacity).toBe("1");
    }
    // The busy line is drawn by the table, so it adds no row and no element to read.
    expect(page.getByRole("row").all()).toHaveLength(4);
    const table = page.getByRole("table").element() as HTMLElement;
    const line = getComputedStyle(table, "::after");
    expect(line.backgroundImage).toContain(tokenColor("--qx-color-bg-brand-bold"));
    for (const density of DENSITIES) {
      html.dataset.qxDensity = density;
      const header = box("thead tr");
      const top = table.getBoundingClientRect().top + Number.parseFloat(line.top);
      const height = Number.parseFloat(line.height);
      // The line lies along the header band's foot, across the whole table…
      // On the pixel: in compact, a sort button (24px) and the cell padding make the header band
      // half a pixel taller than the row (32.5px), and the line keeps to the row's height.
      expect(Math.abs(top + height - header.bottom), density).toBeLessThanOrEqual(0.5);
      expect(Math.abs(Number.parseFloat(line.width) - header.width), density).toBeLessThan(0.5);
      expect(height, density).toBe(2);
      // …and the rows under it don't move.
      expect(Math.abs(box("tbody tr").top - (before[density] as number)), density).toBe(0);
    }
    delete html.dataset.qxDensity;
    await expectAccessible(container);
    await screenshotEveryMode("Table · refreshing");
  });

  it("runs the busy line right to left, and keeps it under reduced motion and forced colours", async () => {
    await render(
      <div dir="rtl">
        <Invoices loading />
      </div>,
    );
    const table = page.getByRole("table").element() as HTMLElement;
    const line = () => getComputedStyle(table, "::after");
    expect(line().animationName).toBe("qx-table-busy");
    expect(line().animationDirection).toBe("reverse");
    if (!canEmulateMedia) return;
    const resetMotion = await emulateMedia({ "prefers-reduced-motion": "reduce" });
    // The slide would stop at 0ms: the line spans the band and fades instead.
    expect(line().animationName).toBe("qx-table-busy-fade");
    expect(line().backgroundSize).toBe("100% 100%");
    await resetMotion();
    const resetColours = await emulateMedia({ "forced-colors": "active" });
    expect(line().backgroundImage).toContain(systemColor("Highlight"));
    await resetColours();
  });

  it("announces a refresh politely, and doesn't repeat the selection count when it ends", async () => {
    const { rerender } = await render(<Invoices selectable defaultSelected={["INV-0042"]} />);
    for (const region of regions()) expect(region.getAttribute("aria-live")).toBe("polite");
    expect(live()).toBe("");
    expect(liveCount()).toBe("1 selected");
    await rerender(<Invoices selectable defaultSelected={["INV-0042"]} loading />);
    expect(live()).toBe("Loading");
    await rerender(<Invoices selectable defaultSelected={["INV-0042"]} />);
    expect(live()).toBe("");
    expect(liveCount()).toBe("1 selected");
  });

  it("in a Card, keeps the bar's height when the first row is ticked, at every density", async () => {
    await page.viewport(800, 400);
    await render(
      <Card>
        <Invoices
          selectable
          toolbar={<Input aria-label="Search invoices" style={{ inlineSize: 240 }} />}
          bulkActions={() => (
            <Button size="sm" variant="soft">
              Send reminder
            </Button>
          )}
        />
      </Card>,
    );
    for (const density of DENSITIES) {
      html.dataset.qxDensity = density;
      const control = Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--qx-size-control-lg"),
      );
      const toolbar = box(".qx-table-bar");
      const header = box("thead tr").top;
      // A field's height plus 8px above and below.
      expect(toolbar.height, density).toBe(control * 16 + 16);
      await checkbox("Select INV-0042").click();
      await expect.element(page.getByRole("button", { name: "Clear selection" })).toBeVisible();
      const selection = box(".qx-table-bar");
      expect(selection.height, density).toBe(toolbar.height);
      expect(box("thead tr").top, density).toBe(header);
      await page.getByRole("button", { name: "Clear selection" }).click();
      await expect.element(page.getByRole("textbox", { name: "Search invoices" })).toBeVisible();
    }
    delete html.dataset.qxDensity;
  });

  it("outside a Card, keeps the bar a field's height either way", async () => {
    await render(
      <Invoices
        selectable
        toolbar={<Input aria-label="Search invoices" style={{ inlineSize: 240 }} />}
      />,
    );
    const toolbar = box(".qx-table-bar").height;
    await checkbox("Select INV-0042").click();
    await expect.element(page.getByRole("button", { name: "Clear selection" })).toBeVisible();
    expect(box(".qx-table-bar").height).toBe(toolbar);
    expect(toolbar).toBe(40);
  });

  it("formats the selection count for the locale", async () => {
    const many = Array.from({ length: 1500 }, (_, index) => `INV-${index}`);
    await render(
      <QeetrixProvider locale="de-DE">
        <Invoices selectable selected={many} />
      </QeetrixProvider>,
    );
    await expect
      .poll(() => document.querySelector("[data-slot=table-count]")?.textContent)
      .toBe("1.500 selected");
    expect(liveCount()).toBe("1.500 selected");
  });

  it("opens a record from its row: the primary cell holds the one link, and the row follows it", async () => {
    await render(<Invoices rowHref={(row) => `#/invoices/${row.id}`} />);
    const row = page.getByRole("row", { name: /INV-0043/ }).element();
    const links = row.querySelectorAll("a");
    expect(links).toHaveLength(1);
    await expect
      .element(page.getByRole("link", { name: "INV-0043" }))
      .toHaveAttribute("href", "#/invoices/INV-0043");
    expect(row.hasAttribute("data-clickable")).toBe(true);
    // Anywhere else on the row: the customer, the status badge, the amount.
    await page.getByRole("cell", { name: "Bharat Foods" }).click();
    expect(window.location.hash).toBe("#/invoices/INV-0043");
    await page.getByText("Paid").first().click();
    expect(window.location.hash).toBe("#/invoices/INV-0042");
    window.location.hash = "";
  });

  it("keeps an unselectable row out: its checkbox is disabled with its reason, the header skips it", async () => {
    const onSelectedChange = vi.fn();
    await render(
      <Invoices
        selectable
        onSelectedChange={onSelectedChange}
        rowSelectable={(row) => row.id !== "INV-0043"}
        rowUnselectableReason={() => "Paid invoices can't be voided"}
      />,
    );
    const locked = page.getByRole("checkbox", { name: "Select INV-0043" });
    expect(locked.element().hasAttribute("data-disabled")).toBe(true);
    await expect.element(locked).toHaveAccessibleDescription("Paid invoices can't be voided");
    await page.getByRole("checkbox", { name: "Select all rows" }).click();
    const chosen = onSelectedChange.mock.calls.at(-1)?.[0] as string[];
    expect(chosen).not.toContain("INV-0043");
    expect(chosen.length).toBeGreaterThan(0);
    await expect
      .element(page.getByRole("checkbox", { name: "Select all rows" }))
      .toHaveAttribute("aria-checked", "true");
  });

  it("hides low- and medium-priority columns as the table narrows", async () => {
    const columns: TableColumn<Invoice>[] = COLUMNS.map((column, index) =>
      index === 1
        ? { ...column, priority: "low" }
        : index === 2
          ? { ...column, priority: "medium" }
          : column,
    );
    const { container } = await render(
      <div style={{ inlineSize: 700 }}>
        <Invoices columns={columns} />
      </div>,
    );
    const shown = () =>
      [...container.querySelectorAll("thead th")].filter(
        (th) => getComputedStyle(th).display !== "none",
      ).length;
    expect(shown()).toBe(columns.length);
    (container.firstElementChild as HTMLElement).style.inlineSize = "600px";
    await expect.poll(shown).toBe(columns.length - 1);
    (container.firstElementChild as HTMLElement).style.inlineSize = "400px";
    await expect.poll(shown).toBe(columns.length - 2);
  });

  it("marks the current row, whose record is open beside the list", async () => {
    await render(<Invoices currentRow="INV-0043" />);
    const row = page.getByRole("row", { name: /INV-0043/ });
    await expect.element(row).toHaveAttribute("aria-current", "true");
    const cell = row.element().querySelector("td") as HTMLElement;
    expect(getComputedStyle(cell).backgroundColor).toBe(tokenColor("--qx-color-bg-selected"));
  });

  it("leaves a row without its actions menu when rowActions returns nothing", async () => {
    await render(
      <Invoices
        rowActions={(row) => (row.status === "Paid" ? null : <MenuItem>Send a reminder</MenuItem>)}
      />,
    );
    expect(page.getByRole("button", { name: "Actions for INV-0042" }).elements()).toHaveLength(0);
    await expect.element(page.getByRole("button", { name: "Actions for INV-0043" })).toBeVisible();
  });

  it("scrolls sideways itself when wider than its space, as a labelled region keyboard users reach", async () => {
    // Content that can't shrink, as a wide table's has: four 260px columns in 600px.
    const wide = COLUMNS.map((column) => ({
      ...column,
      cell: (row: Invoice) => (
        <span style={{ display: "inline-block", inlineSize: 260 }}>{column.cell(row)}</span>
      ),
    }));
    const { container } = await render(
      <div style={{ inlineSize: 600 }}>
        <Invoices columns={wide} />
      </div>,
    );
    const scroll = container.querySelector("[data-slot=table-scroll]") as HTMLElement;
    await expect.poll(() => scroll.hasAttribute("data-overflowing")).toBe(true);
    await expect.element(page.getByRole("region", { name: "Recent invoices" })).toBeVisible();
    expect(scroll.tabIndex).toBe(0);
    expect(getComputedStyle(scroll).overflowX).toBe("auto");
    (container.firstElementChild as HTMLElement).style.inlineSize = "1400px";
    await expect.poll(() => scroll.hasAttribute("data-overflowing")).toBe(false);
    expect(scroll.hasAttribute("tabindex")).toBe(false);
    // Measured and fitting, it isn't a scroll container: the sticky header sticks to the page.
    expect(scroll.hasAttribute("data-measured")).toBe(true);
    expect(getComputedStyle(scroll).overflowX).toBe("visible");
  });

  it("scrolls until it's measured, so a wide table rendered on the server doesn't overflow", async () => {
    // No ResizeObserver: the table is never measured, as before hydration or on a static page.
    const saved = window.ResizeObserver;
    Object.defineProperty(window, "ResizeObserver", { value: undefined, configurable: true });
    try {
      const wide = COLUMNS.map((column) => ({
        ...column,
        cell: (row: Invoice) => (
          <span style={{ display: "inline-block", inlineSize: 260 }}>{column.cell(row)}</span>
        ),
      }));
      const { container } = await render(
        <div style={{ inlineSize: 600 }}>
          <Invoices columns={wide} />
        </div>,
      );
      const box = container.firstElementChild as HTMLElement;
      const scroll = container.querySelector("[data-slot=table-scroll]") as HTMLElement;
      expect(scroll.hasAttribute("data-measured")).toBe(false);
      expect(getComputedStyle(scroll).overflowX).toBe("auto");
      expect(box.scrollWidth).toBeLessThanOrEqual(600);
    } finally {
      Object.defineProperty(window, "ResizeObserver", { value: saved, configurable: true });
    }
  });

  it("wraps the selection's bar on a narrow page: its count, actions and Clear stay inside", async () => {
    const { container } = await render(
      <div style={{ inlineSize: 320 }}>
        <Invoices
          selectable
          defaultSelected={["INV-0042"]}
          bulkActions={() => (
            <>
              <Button size="sm" variant="soft">
                Send reminders
              </Button>
              <Button size="sm" variant="soft" tone="danger">
                Delete invoices
              </Button>
            </>
          )}
        />
      </div>,
    );
    const bar = container.querySelector("[data-slot=table-bar]") as HTMLElement;
    const edge = bar.getBoundingClientRect();
    for (const button of bar.querySelectorAll("button")) {
      expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(edge.right + 0.5);
    }
    expect((container.firstElementChild as HTMLElement).scrollWidth).toBeLessThanOrEqual(320);
    expect(edge.height).toBeGreaterThan(48);
  });

  it("names a row's link by its rowLabel, and describes it by the rest of the cell", async () => {
    await render(
      <Invoices
        rowHref={(row) => `#/invoices/${row.id}`}
        columns={[
          {
            id: "invoice",
            header: "Invoice",
            primary: true,
            cell: (row) => (
              <>
                {row.id}
                <span> · {row.customer}</span>
              </>
            ),
          },
        ]}
      />,
    );
    const link = page.getByRole("link", { name: "INV-0043" });
    await expect.element(link).toHaveAccessibleName("INV-0043");
    await expect.element(link).toHaveAccessibleDescription("INV-0043 · Bharat Foods");
  });

  it("puts a router's link in the primary column, and passes modifier keys to it", async () => {
    await render(
      <Invoices
        columns={[
          COLUMNS[1] as TableColumn<Invoice>,
          { ...(COLUMNS[0] as TableColumn<Invoice>), primary: true },
        ]}
        renderRowLink={(row) => <RouterLink to={`/invoices/${row.id}`} />}
      />,
    );
    const link = page.getByRole("link", { name: "INV-0042" });
    await expect.element(link).toHaveAttribute("href", "/invoices/INV-0042");
    expect(link.element().classList.contains("qx-table-row-link")).toBe(true);
    await page.getByRole("cell", { name: "Acme Retail" }).click();
    expect(navigate).toHaveBeenLastCalledWith("/invoices/INV-0042", {
      ctrlKey: false,
      metaKey: false,
    });
    // Firefox keeps Ctrl/Cmd-click on a table cell for selecting cells; the link itself still takes it.
    if (server.browser !== "firefox") {
      await page
        .getByRole("cell", { name: "Coastal Labs" })
        .click({ modifiers: ["ControlOrMeta"] });
      expect(navigate).toHaveBeenCalledTimes(2);
      const [, keys] = navigate.mock.lastCall ?? [];
      expect(keys.ctrlKey || keys.metaKey).toBe(true);
    }
  });

  it("leaves the row's checkbox, its menu and selected text alone", async () => {
    const onClick = vi.fn();
    await render(
      <Invoices
        selectable
        rowActions={() => <MenuItem onClick={onClick}>Void</MenuItem>}
        renderRowLink={(row) => <RouterLink to={`/invoices/${row.id}`} />}
      />,
    );
    await checkbox("Select INV-0043").click();
    await expect.element(checkbox("Select INV-0043")).toHaveAttribute("aria-checked", "true");
    await page.getByRole("button", { name: "Actions for INV-0043" }).click();
    await page.getByRole("menuitem", { name: "Void" }).click();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
    // Selecting a cell's text to copy it isn't a click on the row.
    const cell = page.getByRole("cell", { name: "Bharat Foods" }).element();
    window.getSelection()?.selectAllChildren(cell);
    cell.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(navigate).not.toHaveBeenCalled();
    window.getSelection()?.removeAllRanges();
    cell.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(navigate).toHaveBeenCalledWith("/invoices/INV-0043", expect.anything());
  });

  it("opens a row from the keyboard: one Tab stop per row, Enter on its link or button", async () => {
    const onRowClick = vi.fn();
    const { rerender } = await render(<Invoices selectable onRowClick={onRowClick} />);
    // Without a link, the primary cell is a button that opens the row.
    const button = page.getByRole("button", { name: "INV-0042" }).element() as HTMLElement;
    (page.getByRole("checkbox", { name: "Select INV-0042" }).element() as HTMLElement).focus();
    await tab();
    expect(document.activeElement).toBe(button);
    await userEvent.keyboard("{Enter}");
    expect(onRowClick).toHaveBeenLastCalledWith(INVOICES[0]);
    await tab();
    expect(document.activeElement).toBe(
      page.getByRole("checkbox", { name: "Select INV-0043" }).element(),
    );
    await page.getByRole("cell", { name: "Coastal Labs" }).click();
    expect(onRowClick).toHaveBeenLastCalledWith(INVOICES[2]);
    expect(onRowClick).toHaveBeenCalledTimes(2);

    await rerender(<Invoices renderRowLink={(row) => <RouterLink to={`/invoices/${row.id}`} />} />);
    (page.getByRole("link", { name: "INV-0044" }).element() as HTMLElement).focus();
    await userEvent.keyboard("{Enter}");
    expect(navigate).toHaveBeenLastCalledWith("/invoices/INV-0044", expect.anything());
  });

  it("points and underlines the link under the pointer; keyboard focus frames it and tints the row", async () => {
    await render(<Invoices rowHref={(row) => `#/invoices/${row.id}`} />);
    const cell = page.getByRole("cell", { name: "Bharat Foods" });
    const link = page.getByRole("link", { name: "INV-0043" }).element() as HTMLElement;
    expect(getComputedStyle(link).textDecorationLine).toBe("none");
    await cell.hover();
    expect(getComputedStyle(cell.element()).cursor).toBe("pointer");
    expect(getComputedStyle(cell.element()).backgroundColor).toBe(
      tokenColor("--qx-color-bg-neutral-subtle"),
    );
    expect(getComputedStyle(link).textDecorationLine).toBe("underline");
    // The link inherits the cell's look: no link colour in every row.
    expect(getComputedStyle(link).color).toBe(tokenColor("--qx-color-text-default"));
    await userEvent.unhover(cell);
    // The last header button, then Tab: the first row's link, with keyboard focus showing.
    (page.getByRole("button", { name: "Amount" }).element() as HTMLElement).focus();
    await tab();
    const first = page.getByRole("link", { name: "INV-0042" }).element() as HTMLElement;
    expect(document.activeElement).toBe(first);
    expect(getComputedStyle(first).outlineColor).toBe(tokenColor("--qx-color-border-focus"));
    expect(getComputedStyle(first).outlineWidth).toBe("2px");
    const row = page.getByRole("row", { name: /INV-0042/ }).element();
    expect(getComputedStyle(row.querySelectorAll("td")[1] as HTMLElement).backgroundColor).toBe(
      tokenColor("--qx-color-bg-neutral-subtle"),
    );
  });

  it("is accessible with clickable rows, and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <div style={{ inlineSize: 560 }}>
          <Invoices
            selectable
            defaultSelected={["INV-0044"]}
            rowHref={(row) => `#/invoices/${row.id}`}
            rowActions={() => <MenuItem>Void</MenuItem>}
          />
        </div>
      </Stage>,
    );
    await expectAccessible(container);
    await page.getByRole("cell", { name: "Bharat Foods" }).hover();
    await screenshotEveryMode("Table · clickable rows");
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
