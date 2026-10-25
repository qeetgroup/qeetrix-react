import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Button } from "../button/button";
import { Stack } from "../stack/stack";
import { Table } from "../table/table";
import { Text } from "../text/text";
import { Card } from "./card";

function Invoices() {
  return (
    <Table
      label="Recent invoices"
      rows={[{ id: "INV-0042", amount: "₹1,24,500" }]}
      rowId={(row) => row.id}
      rowLabel={(row) => row.id}
      columns={[
        { id: "invoice", header: "Invoice", cell: (row) => row.id },
        { id: "amount", header: "Amount", cell: (row) => row.amount, numeric: true },
      ]}
    />
  );
}

describe("Card", () => {
  it("is a section labelled by its title, at the level the page sets", async () => {
    await render(
      <Card title="Recent invoices" level={2} description="Last 30 days">
        <Text>Body</Text>
      </Card>,
    );
    const section = page.getByRole("region", { name: "Recent invoices" });
    await expect.element(section).toBeVisible();
    await expect
      .element(page.getByRole("heading", { level: 2, name: "Recent invoices" }))
      .toBeVisible();
  });

  it("is a plain div without a title, and renders another element on request", async () => {
    const { container } = await render(
      <>
        <Card>Untitled</Card>
        <Card title="Note" level={3} render={<article />}>
          Body
        </Card>
      </>,
    );
    const [plain, article] = [...container.querySelectorAll("[data-slot=card]")];
    expect(plain?.tagName).toBe("DIV");
    expect(article?.tagName).toBe("ARTICLE");
  });

  it("is raised, ruled and shadowless", async () => {
    const { container } = await render(
      <Card title="Totals" level={2}>
        Body
      </Card>,
    );
    const card = container.querySelector("[data-slot=card]") as HTMLElement;
    const style = getComputedStyle(card);
    expect(style.boxShadow).toBe("none");
    expect(style.borderTopWidth).toBe("1px");
    expect(style.borderRadius).toBe("4px");
  });

  it("runs a table edge to edge under the header rule", async () => {
    const { container } = await render(
      <Card title="Recent invoices" level={2}>
        <Invoices />
      </Card>,
    );
    const card = container.querySelector("[data-slot=card]") as HTMLElement;
    const header = container.querySelector("[data-slot=card-header]") as HTMLElement;
    const table = container.querySelector("[data-slot=table]") as HTMLElement;
    const c = card.getBoundingClientRect();
    const t = table.getBoundingClientRect();
    expect(Math.round(t.left)).toBe(Math.round(c.left) + 1);
    expect(Math.round(t.right)).toBe(Math.round(c.right) - 1);
    expect(Math.round(t.top)).toBe(Math.round(header.getBoundingClientRect().bottom));
    expect(Math.round(t.bottom)).toBe(Math.round(c.bottom) - 1);
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <Stack gap="lg" style={{ inlineSize: 360 }}>
          <Card
            title="Recent invoices"
            level={2}
            description="Last 30 days"
            actions={
              <Button variant="ghost" size="sm">
                View all
              </Button>
            }
          >
            <Invoices />
          </Card>
          <Card title="Payout" level={2} footer={<Button size="sm">Withdraw</Button>}>
            <Text>₹3,40,000 available</Text>
          </Card>
        </Stack>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("Card");
  });
});
