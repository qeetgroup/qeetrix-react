import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { Button } from "../../button/button";
import { DescriptionItem, DescriptionList } from "../description-list/description-list";
import { CopyField } from "./copy-field";

const ACS = "https://id.qeet.in/v1/saml/7f3c2a91-4b0e-4c55-9d1a-2f6b8e3c7a10/acs";

describe("CopyField", () => {
  it("is a group named by its label and described by its line, its Copy button named after it", async () => {
    await render(
      <CopyField label="ACS URL" value={ACS} description="Paste it into your identity provider." />,
    );
    const group = page.getByRole("group", { name: "ACS URL" });
    await expect
      .element(group)
      .toHaveAccessibleDescription("Paste it into your identity provider.");
    await expect.element(page.getByRole("button", { name: "Copy ACS URL" })).toBeVisible();
    const value = document.querySelector("[data-slot=copy-field-value]") as HTMLElement;
    expect(value.textContent).toBe(ACS);
    expect(getComputedStyle(value).userSelect).toBe("all");
  });

  it("wraps a long value by default, and keeps it on one line with wrap none", async () => {
    const { container, rerender } = await render(
      <div style={{ inlineSize: 320 }}>
        <CopyField label="ACS URL" value={ACS} />
      </div>,
    );
    const value = () => container.querySelector("[data-slot=copy-field-value]") as HTMLElement;
    // The lines of text: the value's height less its padding, over its line height.
    const lines = () => {
      const style = getComputedStyle(value());
      const padding =
        Number.parseFloat(style.paddingBlockStart) + Number.parseFloat(style.paddingBlockEnd);
      return (
        (value().getBoundingClientRect().height - padding) / Number.parseFloat(style.lineHeight)
      );
    };
    expect(lines()).toBeGreaterThan(1.5);
    await rerender(
      <div style={{ inlineSize: 320 }}>
        <CopyField label="ACS URL" value={ACS} wrap="none" />
      </div>,
    );
    expect(lines()).toBeCloseTo(1, 1);
  });

  it("as a row, puts the label beside the value and Copy at the end", async () => {
    await render(
      <div style={{ inlineSize: 640 }}>
        <CopyField layout="row" label="Client ID" value="qci_7f3c2a" />
      </div>,
    );
    const label = page.getByText("Client ID").element().getBoundingClientRect();
    const value = page.getByText("qci_7f3c2a").element().getBoundingClientRect();
    expect(value.left).toBeGreaterThan(label.right);
    expect(Math.abs(value.top - label.top)).toBeLessThan(8);
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <CopyField
          label="ACS URL"
          value={ACS}
          description="Paste it into your identity provider."
        />
        <CopyField layout="row" label="Client ID" value="qci_7f3c2a" />
        <CopyField layout="row" label="Entity ID" value="https://id.qeet.in/v1/saml/7f3c2a" />
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("CopyField");
  });
});

/** A SAML connection's setup section: values to copy beside plain facts, in one list. */
function Connection({ wrap = "anywhere" }: { wrap?: "anywhere" | "none" }) {
  return (
    <DescriptionList>
      <CopyField
        layout="row"
        label="ACS URL"
        value={ACS}
        wrap={wrap}
        description="Paste it into your identity provider."
      />
      <CopyField layout="row" label="Entity ID" value="https://id.qeet.in/v1/saml/7f3c2a" />
      <DescriptionItem term="NameID format">Email address</DescriptionItem>
      <DescriptionItem
        term="Metadata"
        action={
          <Button size="sm" variant="ghost">
            Replace
          </Button>
        }
      >
        okta-metadata.xml
      </DescriptionItem>
    </DescriptionList>
  );
}

describe("CopyField in a DescriptionList", () => {
  const original = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  let writeText: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  });
  afterEach(() => {
    if (original) Object.defineProperty(navigator, "clipboard", original);
  });

  it("is one of the list's items, beside plain facts: valid dl content", async () => {
    const { container } = await render(<Connection />);
    const list = container.querySelector("dl") as HTMLElement;
    const items = [...list.children];
    expect(items.map((item) => item.tagName)).toEqual(["DIV", "DIV", "DIV", "DIV"]);
    for (const item of items) {
      expect(item.hasAttribute("role")).toBe(false);
      expect(item.firstElementChild?.tagName).toBe("DT");
      expect([...item.children].slice(1).every((child) => child.tagName === "DD")).toBe(true);
    }
    expect([...list.querySelectorAll("dt")].map((term) => term.textContent)).toEqual([
      "ACS URL",
      "Entity ID",
      "NameID format",
      "Metadata",
    ]);
    // The value is its term's description, still in code type and selected whole by one click.
    const value = items[0]?.querySelector("dd [data-slot=copy-field-value]") as HTMLElement;
    expect(value.tagName).toBe("CODE");
    expect(value.textContent).toBe(ACS);
    expect(getComputedStyle(value).userSelect).toBe("all");
    expect(items[0]?.textContent).toContain("Paste it into your identity provider.");
    // axe's definition-list and dlitem rules pass with copy rows inside.
    await expectAccessible(container);
  });

  it("lines up with the facts in one ruled sheet: the term column, the value, Copy at the end", async () => {
    const { container } = await render(
      <div style={{ inlineSize: 720 }}>
        <Connection />
      </div>,
    );
    const items = [...(container.querySelector("dl") as HTMLElement).children] as HTMLElement[];
    const box = (element: Element | null | undefined) =>
      (element as HTMLElement).getBoundingClientRect();
    const term = (item: HTMLElement) => box(item.querySelector("dt"));
    const value = (item: HTMLElement) => box(item.querySelector("dd"));
    const [acs, entity, nameId, metadata] = items as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ];
    for (const copyRow of [acs, entity]) {
      expect(term(copyRow).left).toBe(term(nameId).left);
      expect(value(copyRow).left).toBe(value(nameId).left);
    }
    // Copy ends each copy row where the fact row's action ends: the sheet's end.
    const copy = box(page.getByRole("button", { name: "Copy Entity ID" }).element());
    const replace = box(page.getByRole("button", { name: "Replace" }).element());
    expect(copy.right).toBe(replace.right);
    expect(copy.left).toBeGreaterThan(value(entity).left);
    // A rule between every two items, copy rows and facts alike; none above the first.
    expect(getComputedStyle(acs).borderTopWidth).toBe("0px");
    for (const item of [entity, nameId, metadata])
      expect(getComputedStyle(item).borderTopWidth).toBe("1px");
  });

  it("keeps its Copy button's name and its polite Copied", async () => {
    await render(<Connection />);
    const button = page.getByRole("button", { name: "Copy ACS URL" });
    await button.click();
    expect(writeText).toHaveBeenCalledWith(ACS);
    const status = () => document.querySelector("[role=status]") as HTMLElement;
    await expect.poll(() => status().textContent).toBe("Copied");
    expect(status().getAttribute("aria-live") ?? "polite").toBe("polite");
  });

  it("keeps a long value on one line with wrap none", async () => {
    const { container } = await render(
      <div style={{ inlineSize: 480 }}>
        <Connection wrap="none" />
      </div>,
    );
    const value = container.querySelector("[data-slot=copy-field-value]") as HTMLElement;
    expect(value.scrollWidth).toBeGreaterThan(value.clientWidth);
    expect(getComputedStyle(value).textOverflow).toBe("ellipsis");
    // One line: its height is the line height (WebKit's is a hair off a whole pixel).
    expect(value.getBoundingClientRect().height).toBeCloseTo(
      Number.parseFloat(getComputedStyle(value).lineHeight),
      1,
    );
  });

  it("looks right in every mode", async () => {
    await render(
      <Stage>
        <div style={{ inlineSize: 560 }}>
          <Connection />
        </div>
      </Stage>,
    );
    await screenshotEveryMode("CopyField · in a DescriptionList");
  });
});
