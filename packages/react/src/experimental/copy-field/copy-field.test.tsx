import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
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
    const line = Number.parseFloat(getComputedStyle(value()).lineHeight);
    expect(value().getBoundingClientRect().height).toBeGreaterThan(line * 1.5);
    await rerender(
      <div style={{ inlineSize: 320 }}>
        <CopyField label="ACS URL" value={ACS} wrap="none" />
      </div>,
    );
    expect(value().getBoundingClientRect().height).toBeLessThan(line * 1.5);
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
