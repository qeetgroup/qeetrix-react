import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { Badge } from "../../badge/badge";
import { Button } from "../../button/button";
import { Card } from "../../card/card";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { CopyButton } from "../copy-button/copy-button";
import { DescriptionItem, DescriptionList } from "./description-list";

function Profile({ width = 520 }: { width?: number }) {
  return (
    <div style={{ inlineSize: width }}>
      <DescriptionList>
        <DescriptionItem term="Email">
          priya@acme.in
          <CopyButton value="priya@acme.in" label="Copy email" size="sm" />
        </DescriptionItem>
        <DescriptionItem term="Status">
          <Badge tone="success">Active</Badge>
        </DescriptionItem>
        <DescriptionItem term="Manager" />
      </DescriptionList>
    </div>
  );
}

const box = (selector: string, index = 0) =>
  (document.querySelectorAll(selector)[index] as HTMLElement).getBoundingClientRect();

describe("DescriptionList", () => {
  it("is a list of terms and values, read as pairs", async () => {
    await render(<Profile />);
    expect(document.querySelector("dl > div > dt + dd")).not.toBeNull();
    await expect.element(page.getByRole("term").first()).toHaveTextContent("Email");
    await expect.element(page.getByRole("definition").first()).toHaveTextContent("priya@acme.in");
  });

  it("shows an empty value as a dash, read as Not set", async () => {
    await render(<Profile />);
    const manager = page.getByRole("definition").nth(2);
    await expect.element(manager).toHaveTextContent("—Not set");
    expect(manager.element().querySelector("[aria-hidden]")?.textContent).toBe("—");
  });

  it("puts each term beside its value, or above it where the list is narrow", async () => {
    const { rerender } = await render(<Profile width={520} />);
    const term = box(".qx-description-term");
    const value = box(".qx-description-value");
    // Beside it, within the value's first line.
    expect(term.right).toBeLessThan(value.left);
    expect(term.top).toBeGreaterThanOrEqual(value.top);
    expect(term.bottom).toBeLessThanOrEqual(value.bottom);
    await rerender(<Profile width={300} />);
    expect(box(".qx-description-term").bottom).toBeLessThanOrEqual(
      box(".qx-description-value").top,
    );
  });

  it("holds a Settings row: a sentence under the value and an action at the row's end", async () => {
    const { container } = await render(
      <div style={{ inlineSize: 640 }}>
        <DescriptionList>
          <DescriptionItem
            term="Name"
            description="Shown in the top bar and in invitations."
            action={<Button variant="ghost">Change</Button>}
          >
            Qeet Group
          </DescriptionItem>
        </DescriptionList>
      </div>,
    );
    await expectAccessible(container);
    const item = container.querySelector("[data-slot=description-item]") as HTMLElement;
    const change = page.getByRole("button", { name: "Change" }).element();
    expect(Math.round(item.getBoundingClientRect().right)).toBe(
      Math.round(change.getBoundingClientRect().right),
    );
    const note = page.getByText("Shown in the top bar and in invitations.").element();
    const value = container.querySelector("[data-slot=description-value]") as HTMLElement;
    expect(value.textContent).toContain("Qeet Group");
    expect(note.getBoundingClientRect().top).toBeGreaterThan(value.getBoundingClientRect().top);
    expect(change.closest("dd")).not.toBeNull();
  });

  it("lays columns out up to the count, fewer where there isn't room", async () => {
    const facts = (
      <DescriptionList layout="columns" columns={4}>
        <DescriptionItem term="Sessions">3 active</DescriptionItem>
        <DescriptionItem term="MFA">On</DescriptionItem>
        <DescriptionItem term="Applications">12</DescriptionItem>
        <DescriptionItem term="Source">Azure AD</DescriptionItem>
      </DescriptionList>
    );
    const tops = () =>
      new Set(
        [...document.querySelectorAll(".qx-description-item")].map(
          (item) => item.getBoundingClientRect().top,
        ),
      ).size;
    const { rerender } = await render(<div style={{ inlineSize: 800 }}>{facts}</div>);
    expect(tops()).toBe(1);
    await rerender(<div style={{ inlineSize: 380 }}>{facts}</div>);
    expect(tops()).toBe(2);
  });

  it("runs edge to edge in a Card, its rows keeping the card's padding", async () => {
    await render(
      <div style={{ inlineSize: 520 }}>
        <Card title="Profile" level={2}>
          <DescriptionList>
            <DescriptionItem term="Email">priya@acme.in</DescriptionItem>
            <DescriptionItem term="Status">Active</DescriptionItem>
          </DescriptionList>
        </Card>
      </div>,
    );
    const card = box(".qx-card");
    const item = box(".qx-description-item");
    expect(Math.abs(item.left - card.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(item.right - card.right)).toBeLessThanOrEqual(1);
    expect(box(".qx-description-term").left).toBe(box(".qx-card-heading").left);
  });

  it("speaks Hindi through QeetrixProvider", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <DescriptionList>
          <DescriptionItem term="प्रबंधक" />
        </DescriptionList>
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("definition")).toHaveTextContent("—सेट नहीं है");
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(900, 520);
    const { container } = await render(
      <div
        data-qx-stage=""
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: 24,
          alignItems: "start",
          padding: 16,
          inlineSize: 860,
          background: "var(--qx-color-surface-canvas)",
        }}
      >
        <Card title="Profile" level={2}>
          <DescriptionList>
            <DescriptionItem term="Email">
              priya@acme.in
              <CopyButton value="priya@acme.in" label="Copy email" size="sm" />
            </DescriptionItem>
            <DescriptionItem term="User ID">
              <span style={{ fontFamily: "var(--qx-typography-code-md-font-family)" }}>
                usr_8f2k1QmZ
              </span>
              <CopyButton value="usr_8f2k1QmZ" label="Copy user ID" size="sm" />
            </DescriptionItem>
            <DescriptionItem term="Status">
              <Badge tone="success">Active</Badge>
            </DescriptionItem>
            <DescriptionItem term="Groups">
              <Badge>Engineering</Badge>
              <Badge>Admins</Badge>
            </DescriptionItem>
            <DescriptionItem term="Manager" />
            <DescriptionItem term="Last sign-in">2 minutes ago · Bengaluru, India</DescriptionItem>
          </DescriptionList>
        </Card>
        <Card title="Summary" level={2}>
          <DescriptionList layout="columns">
            <DescriptionItem term="Sessions">3 active</DescriptionItem>
            <DescriptionItem term="MFA">On</DescriptionItem>
            <DescriptionItem term="Applications">12</DescriptionItem>
            <DescriptionItem term="Source">Azure AD</DescriptionItem>
          </DescriptionList>
        </Card>
      </div>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("DescriptionList", "[data-qx-stage]");
  });
});
