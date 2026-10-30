import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { settled } from "../../tests/support/settled";
import { Stage } from "../../tests/support/stage";
import { Button } from "../button/button";
import { Pagination } from "../experimental/pagination/pagination";
import { Stack } from "../stack/stack";
import { Table } from "../table/table";
import { Text } from "../text/text";
import { TextField } from "../text-field/text-field";
import { Card } from "./card";

const html = document.documentElement;
const DENSITIES = ["compact", "default", "comfortable"] as const;
const SCHEMES = ["light", "dark"] as const;
const rect = (element: Element) => element.getBoundingClientRect();
const slot = (root: Element, name: string) =>
  root.querySelector(`[data-slot=${name}]`) as HTMLElement;

/** axe in the light scheme and the dark one: contrast differs between them. */
async function expectAccessibleInBothSchemes(element: Element) {
  try {
    for (const scheme of SCHEMES) {
      html.dataset.qxColorScheme = scheme;
      await expectAccessible(element);
    }
  } finally {
    delete html.dataset.qxColorScheme;
  }
}

afterEach(() => {
  delete html.dataset.qxColorScheme;
  delete html.dataset.qxDensity;
});

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

/** A child that renders nothing. */
function Empty() {
  return null;
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

  it("lines the footer's actions up with the fields above it, at every density", async () => {
    const { container } = await render(
      <Card
        title="Organisation"
        level={2}
        style={{ inlineSize: 480 }}
        footer={
          <>
            <Button variant="ghost" size="lg">
              Cancel
            </Button>
            <Button size="lg">Save</Button>
          </>
        }
      >
        <TextField label="Name" defaultValue="Acme Pvt Ltd" />
      </Card>,
    );
    const card = slot(container, "card");
    const field = slot(container, "input");
    const footer = slot(container, "card-footer");
    const title = container.querySelector("h2") as HTMLElement;
    const cancel = page.getByRole("button", { name: "Cancel" }).element();
    const save = page.getByRole("button", { name: "Save" }).element();
    for (const density of DENSITIES) {
      html.dataset.qxDensity = density;
      await settled();
      // The fields sit 16px inside the 1px border; so do the footer's actions, at both ends.
      expect(rect(field).left - rect(card).left, density).toBeCloseTo(17, 1);
      expect(rect(card).right - rect(save).right, density).toBeCloseTo(17, 1);
      expect(rect(save).right - rect(field).right, density).toBeCloseTo(0, 1);
      expect(rect(title).left - rect(field).left, density).toBeCloseTo(0, 1);
      // And 16px above and below them, the header's inset.
      expect(rect(cancel).top - rect(footer).top, density).toBeCloseTo(17, 1);
      expect(rect(footer).bottom - rect(save).bottom, density).toBeCloseTo(16, 1);
    }
  });

  it("keeps the table's inset in the footer under an edge-to-edge table", async () => {
    await page.viewport(1000, 800);
    const { container } = await render(
      <Card
        style={{ inlineSize: 720 }}
        footer={<Pagination offset={0} pageSize={25} total={1284} onOffsetChange={() => {}} />}
      >
        <Invoices />
      </Card>,
    );
    const row = container.querySelector("tbody tr") as HTMLElement;
    const first = row.firstElementChild as HTMLElement;
    const last = row.lastElementChild as HTMLElement;
    const pagination = slot(container, "pagination");
    for (const density of DENSITIES) {
      html.dataset.qxDensity = density;
      await settled();
      // Pagination starts and ends where the cells' content does: 12px in.
      const start = rect(first).left + Number.parseFloat(getComputedStyle(first).paddingLeft);
      const end = rect(last).right - Number.parseFloat(getComputedStyle(last).paddingRight);
      expect(Math.abs(rect(pagination).left - start), density).toBeLessThan(0.5);
      expect(Math.abs(rect(pagination).right - end), density).toBeLessThan(0.5);
      expect(rect(pagination).left - rect(slot(container, "card")).left).toBeCloseTo(13, 1);
    }
  });

  it("has a subdued surface, for secondary panels: sunken, still ruled and shadowless", async () => {
    const { container } = await render(
      <Card title="Usage" level={2} variant="subdued">
        Body
      </Card>,
    );
    const card = slot(container, "card");
    expect(card.dataset.variant).toBe("subdued");
    for (const scheme of SCHEMES) {
      html.dataset.qxColorScheme = scheme;
      const style = getComputedStyle(card);
      expect(style.backgroundColor, scheme).toBe(tokenColor("--qx-color-surface-sunken"));
      expect(style.borderTopColor, scheme).toBe(tokenColor("--qx-color-border-default"));
      expect(style.borderTopWidth).toBe("1px");
      expect(style.borderRadius).toBe("4px");
      expect(style.boxShadow).toBe("none");
    }
  });

  it("has a danger tone: the border and title in danger, the rules inside neutral", async () => {
    const { container } = await render(
      <Card
        title="Danger zone"
        level={2}
        tone="danger"
        footer={
          <Button tone="danger" size="lg">
            Delete organisation
          </Button>
        }
      >
        <Card title="Nested" level={3}>
          Body
        </Card>
      </Card>,
    );
    const [card, nested] = [...container.querySelectorAll("[data-slot=card]")] as HTMLElement[];
    const title = page.getByRole("heading", { name: "Danger zone" }).element();
    const nestedTitle = page.getByRole("heading", { name: "Nested" }).element();
    expect(card?.dataset.tone).toBe("danger");
    for (const scheme of SCHEMES) {
      html.dataset.qxColorScheme = scheme;
      const style = getComputedStyle(card as HTMLElement);
      expect(style.borderTopColor, scheme).toBe(tokenColor("--qx-color-border-danger"));
      expect(style.borderInlineStartColor, scheme).toBe(tokenColor("--qx-color-border-danger"));
      expect(style.backgroundColor, scheme).toBe(tokenColor("--qx-color-surface-raised"));
      expect(getComputedStyle(title).color, scheme).toBe(tokenColor("--qx-color-text-danger"));
      expect(
        getComputedStyle(slot(card as HTMLElement, "card-header")).borderBottomColor,
        scheme,
      ).toBe(tokenColor("--qx-color-border-default"));
      expect(
        getComputedStyle(slot(card as HTMLElement, "card-footer")).borderTopColor,
        scheme,
      ).toBe(tokenColor("--qx-color-border-default"));
      // A card inside keeps its own look.
      expect(getComputedStyle(nested as HTMLElement).borderTopColor, scheme).toBe(
        tokenColor("--qx-color-border-default"),
      );
      expect(getComputedStyle(nestedTitle).color, scheme).toBe(
        tokenColor("--qx-color-text-default"),
      );
    }
  });

  it("renders no body without children: a header-only card ends at its header (QTRX-174)", async () => {
    const { container } = await render(
      <Stack gap="md" style={{ inlineSize: 400 }}>
        <Card
          title="Two-factor authentication"
          level={2}
          actions={<Button size="sm">Manage</Button>}
        />
        <Card title="Danger zone" level={2} footer={<Button size="sm">Delete</Button>}>
          {false}
        </Card>
        <Card title="Rendered nothing" level={2}>
          <Empty />
        </Card>
      </Stack>,
    );
    const [onlyHeader, withFooter, emptyBody] = [
      ...container.querySelectorAll("[data-slot=card]"),
    ] as HTMLElement[];
    for (const card of [onlyHeader, withFooter] as HTMLElement[]) {
      expect(slot(card, "card-body")).toBeNull();
    }
    // The card's edge closes the header: no rule doubles it, and no padding follows.
    const header = slot(onlyHeader as HTMLElement, "card-header");
    expect(getComputedStyle(header).borderBottomWidth).toBe("0px");
    expect(rect(onlyHeader as HTMLElement).height).toBe(rect(header).height + 2);
    // One rule between the header and the footer: the footer's.
    expect(getComputedStyle(slot(withFooter as HTMLElement, "card-header")).borderBottomWidth).toBe(
      "0px",
    );
    expect(getComputedStyle(slot(withFooter as HTMLElement, "card-footer")).borderTopWidth).toBe(
      "1px",
    );
    // A body whose content renders nothing takes no room either.
    expect(rect(slot(emptyBody as HTMLElement, "card-body")).height).toBe(0);
    expect(rect(emptyBody as HTMLElement).height).toBe(
      rect(slot(emptyBody as HTMLElement, "card-header")).height + 2,
    );
  });

  it("renders no variant or tone attributes for the defaults", async () => {
    const { container } = await render(
      <Card variant="default" tone="neutral">
        Body
      </Card>,
    );
    const card = slot(container, "card");
    expect(card.hasAttribute("data-variant")).toBe(false);
    expect(card.hasAttribute("data-tone")).toBe(false);
    expect(getComputedStyle(card).backgroundColor).toBe(tokenColor("--qx-color-surface-raised"));
  });

  it("is accessible in both schemes with its variants, and looks right", async () => {
    const { container } = await render(
      <Stage>
        <Stack gap="lg" style={{ inlineSize: 400 }}>
          <Card
            title="Plan usage"
            level={2}
            variant="subdued"
            description="Resets on 1 November"
            footer={
              <Button variant="ghost" size="lg">
                View billing
              </Button>
            }
          >
            <Text>8,420 of 10,000 monthly active users</Text>
          </Card>
          <Card
            title="Danger zone"
            level={2}
            tone="danger"
            description="These can't be undone."
            footer={
              <Button tone="danger" size="lg">
                Delete organisation
              </Button>
            }
          >
            <Text>Deleting Acme Pvt Ltd removes its 1,284 users and every application.</Text>
          </Card>
          <Card title="Close account" level={2} variant="subdued" tone="danger">
            <Text>Your data is kept for 30 days, then deleted.</Text>
          </Card>
        </Stack>
      </Stage>,
    );
    await expectAccessibleInBothSchemes(container);
    await screenshotEveryMode("Card · variants");
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
    await expectAccessibleInBothSchemes(container);
    await screenshotEveryMode("Card");
  });
});
