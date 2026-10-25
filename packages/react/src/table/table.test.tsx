import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Badge } from "../badge/badge";
import { Checkbox } from "../checkbox/checkbox";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

const html = document.documentElement;

function Invoices() {
  return (
    <Table>
      <TableCaption>Recent invoices</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Checkbox aria-label="Select all" indeterminate />
          </TableHead>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead numeric>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow selected>
          <TableCell>
            <Checkbox aria-label="Select INV-0042" defaultChecked />
          </TableCell>
          <TableCell>INV-0042</TableCell>
          <TableCell>
            <Badge tone="success">Paid</Badge>
          </TableCell>
          <TableCell numeric>₹1,24,500</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <Checkbox aria-label="Select INV-0043" />
          </TableCell>
          <TableCell>INV-0043</TableCell>
          <TableCell>
            <Badge tone="danger">Overdue</Badge>
          </TableCell>
          <TableCell numeric>₹8,200</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

describe("Table", () => {
  it("is a captioned table with column headers", async () => {
    await render(<Invoices />);
    await expect.element(page.getByRole("table", { name: "Recent invoices" })).toBeVisible();
    await expect
      .element(page.getByRole("columnheader", { name: "Amount" }))
      .toHaveAttribute("scope", "col");
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

  it("right-aligns numbers in tabular figures, and tints selected rows", async () => {
    const { container } = await render(<Invoices />);
    const amount = page.getByRole("cell", { name: "₹1,24,500" }).element();
    expect(getComputedStyle(amount).textAlign).toBe("end");
    expect(getComputedStyle(amount).fontVariantNumeric).toBe("tabular-nums");
    const selected = container.querySelector("tr[data-selected] td") as HTMLElement;
    expect(getComputedStyle(selected).backgroundColor).toBe(tokenColor("--qx-color-bg-selected"));
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <div style={{ inlineSize: 420 }}>
          <Invoices />
        </div>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("Table");
  });
});
