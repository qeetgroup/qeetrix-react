/**
 * Display and status on the server: Card, Badge and Skeleton carry no client code; Table (which
 * holds sort and selection state) and the Base UI ones (Avatar, Progress, Meter) still render their
 * roles and values into the HTML.
 */
import { readFileSync } from "node:fs";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Avatar, Badge, Card, Meter, Progress, Skeleton, Table } from "../src/index";

const html = (node: React.ReactElement) => renderToString(node);
const source = (family: string) =>
  readFileSync(new URL(`../src/${family}/${family}.tsx`, import.meta.url), "utf8");

describe("display and status render on the server", () => {
  it("Card, Badge and Skeleton are server-safe", () => {
    for (const family of ["card", "badge", "skeleton"]) {
      expect(source(family), family).not.toMatch(/^["']use client["']/);
    }
  });

  it("a titled Card is a section labelled by its heading", () => {
    const out = html(
      <Card title="Totals" level={2}>
        Body
      </Card>,
    );
    const id = out.match(/<h2[^>]* id="([^"]+)"/)?.[1];
    expect(out).toMatch(/^<section/);
    expect(out).toContain(`aria-labelledby="${id}"`);
  });

  it("a Table renders its rows, states and sort on the server", () => {
    const out = html(
      <Table
        label="Invoices"
        rows={[{ id: "INV-0043", amount: "₹8,200" }]}
        rowId={(row) => row.id}
        rowLabel={(row) => row.id}
        columns={[
          {
            id: "amount",
            header: "Amount",
            cell: (row) => row.amount,
            numeric: true,
            sortable: true,
          },
        ]}
        selectable
        defaultSelected={["INV-0043"]}
        defaultSort={{ column: "amount", direction: "descending" }}
      />,
    );
    expect(out).toContain('aria-label="Invoices"');
    expect(out).toContain('aria-sort="descending"');
    expect(out).toContain('data-selected=""');
    expect(out).toContain('data-numeric=""');
  });

  it("Badge, Skeleton, Avatar, Progress and Meter", () => {
    expect(html(<Badge tone="danger">Overdue</Badge>)).toContain('data-tone="danger"');
    expect(html(<Skeleton />)).toContain('aria-hidden="true"');
    expect(html(<Avatar name="Priya Sharma" />)).toMatch(
      /role="img"[^>]*aria-label="Priya Sharma"/,
    );
    expect(html(<Progress aria-label="Upload" value={40} />)).toContain('role="progressbar"');
    expect(html(<Meter aria-label="Storage" value={40} />)).toContain('role="meter"');
  });
});
