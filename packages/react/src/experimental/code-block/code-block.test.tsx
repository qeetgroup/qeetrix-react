import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { Card } from "../../card/card";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { CodeBlock } from "./code-block";

const SNIPPET = [
  'import { QeetIdProvider } from "@qeetid/react";',
  "",
  "// Sign-in for every page",
  "export default function App() {",
  '  return <QeetIdProvider issuer="https://acme.id.qeet.in" sessionMinutes={60} />;',
  "}",
].join("\n");
const EVENT =
  '{\n  "type": "user.signed_in",\n  "risk": 0.12,\n  "mfa": true,\n  "device": null\n}';

const original = Object.getOwnPropertyDescriptor(navigator, "clipboard");
let writeText: ReturnType<typeof vi.fn>;
beforeEach(() => {
  writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
});
afterEach(() => {
  if (original) Object.defineProperty(navigator, "clipboard", original);
});

const token = (kind: string, text: string) =>
  [...document.querySelectorAll<HTMLElement>(`[data-token="${kind}"]`)].find(
    (element) => element.textContent === text,
  );

describe("CodeBlock", () => {
  it("colours code with the code tokens", async () => {
    await render(<CodeBlock code={EVENT} language="json" />);
    const cases: [string, string, `--qx-${string}`][] = [
      ["keyword", '"type"', "--qx-color-code-keyword"],
      ["string", '"user.signed_in"', "--qx-color-code-string"],
      ["number", "0.12", "--qx-color-code-number"],
      ["literal", "true", "--qx-color-code-literal"],
      ["punctuation", "{", "--qx-color-code-punctuation"],
    ];
    for (const [kind, text, colour] of cases) {
      const element = token(kind, text) as HTMLElement;
      expect(getComputedStyle(element).color, kind).toBe(tokenColor(colour));
    }
  });

  it("gives several lines a header with the language and Copy, and numbers them", async () => {
    await render(<CodeBlock code={SNIPPET} language="tsx" />);
    await expect.element(page.getByText("TSX", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Copy code" }).click();
    expect(writeText).toHaveBeenCalledWith(SNIPPET);
    const pre = document.querySelector("pre") as HTMLElement;
    expect(pre.hasAttribute("data-numbers")).toBe(true);
    // The numbers are drawn by CSS: the text is the code alone, so selecting and copying it is too.
    const text = [...pre.querySelectorAll(".qx-code-block-text")].map((line) => line.textContent);
    expect(text.join("\n")).toBe(SNIPPET);
    // Each line is one row: its code stays on its number's line.
    const second = pre.querySelectorAll(".qx-code-block-line")[0] as HTMLElement;
    expect(second.getBoundingClientRect().height).toBeLessThan(30);
    const firstLine = pre.querySelector(".qx-code-block-line") as HTMLElement;
    expect(getComputedStyle(firstLine, "::before").content).not.toBe("none");
  });

  it("shows one line as a command: no header, no numbers, Copy beside it", async () => {
    await render(<CodeBlock code="bun add @qeetid/react" language="shell" />);
    expect(document.querySelector(".qx-code-block-header")).toBeNull();
    expect(document.querySelector("pre")?.hasAttribute("data-numbers")).toBe(false);
    await page.getByRole("button", { name: "Copy code" }).click();
    expect(writeText).toHaveBeenCalledWith("bun add @qeetid/react");
    await expect.element(token("keyword", "bun") as HTMLElement).toBeVisible();
  });

  it("scrolls long lines in a named region the keyboard can reach, or wraps them", async () => {
    const long = `"${"https://acme.id.qeet.in/oauth2/".repeat(6)}"`;
    const { rerender } = await render(
      <div style={{ inlineSize: 320 }}>
        <CodeBlock code={long} language="json" title="Redirect" />
      </div>,
    );
    const region = page.getByRole("region", { name: "Redirect" });
    await expect.element(region).toHaveAttribute("tabindex", "0");
    const scroller = region.element() as HTMLElement;
    expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    await userEvent.tab();
    await userEvent.tab();
    await expect.element(region).toHaveFocus();

    await rerender(
      <div style={{ inlineSize: 320 }}>
        <CodeBlock code={long} language="json" title="Redirect" wrap />
      </div>,
    );
    const wrapped = document.querySelector(".qx-code-block-scroll") as HTMLElement;
    expect(wrapped.scrollWidth).toBeLessThanOrEqual(wrapped.clientWidth);
    expect(wrapped.hasAttribute("tabindex")).toBe(false);
  });

  it("wraps a long line under its own start, its indent kept, beside its number, at every density", async () => {
    const url = `"${"https://acme.id.qeet.in/oauth2/".repeat(4)}"`;
    const code = `[\n    ${url},\n  "short"\n]`;
    await render(
      <div style={{ inlineSize: 320 }}>
        <CodeBlock code={code} language="json" wrap />
      </div>,
    );
    const line = document.querySelectorAll<HTMLElement>(".qx-code-block-line")[1] as HTMLElement;
    const text = line.querySelector(".qx-code-block-text") as HTMLElement;
    // Copying still gets the line exactly as written, indent and all.
    expect(text.textContent).toBe(`    ${url},`);
    const html = document.documentElement;
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      const range = document.createRange();
      range.selectNodeContents(token("string", url)?.firstChild as Text);
      const rows = [...range.getClientRects()];
      const indent = Number.parseFloat(getComputedStyle(text).paddingInlineStart);
      const lineHeight = Number.parseFloat(getComputedStyle(text).lineHeight);
      expect(rows.length, density).toBeGreaterThan(1);
      // The token starts on the line's own row, beside its number, not on a blank row below.
      expect(rows[0]?.top ?? 0, density).toBeLessThan(
        line.getBoundingClientRect().top + lineHeight / 2,
      );
      // Four spaces in, and every following row starts under that start.
      const start = rows[0]?.left ?? 0;
      expect(Math.abs(start - text.getBoundingClientRect().left - indent), density).toBeLessThan(
        0.5,
      );
      expect(indent, density).toBeGreaterThan(0);
      for (const row of rows) expect(Math.abs(row.left - start), density).toBeLessThan(0.5);
    }
    delete html.dataset.qxDensity;
  });

  it("fits the number column to the largest line number", async () => {
    const lines = (count: number) =>
      Array.from({ length: count }, (_, index) => `line ${index + 1}`).join("\n");
    const { rerender } = await render(<CodeBlock code={lines(120)} />);
    const widthOf = (digits: string) => {
      const probe = document.createElement("span");
      probe.textContent = digits;
      probe.style.display = "inline-block";
      document.querySelector("pre code")?.append(probe);
      const width = probe.getBoundingClientRect().width;
      probe.remove();
      return width;
    };
    const column = () =>
      Number.parseFloat(
        getComputedStyle(
          document.querySelector(".qx-code-block-line") as HTMLElement,
        ).gridTemplateColumns.split(" ")[0] ?? "0",
      );
    expect(column()).toBeGreaterThanOrEqual(widthOf("120") - 0.5);
    // Every line's code starts at one place, whatever its number's width.
    const starts = [8, 98, 119].map(
      (index) =>
        (
          document.querySelectorAll(".qx-code-block-text")[index] as HTMLElement
        ).getBoundingClientRect().left,
    );
    expect(new Set(starts).size).toBe(1);
    // Short code keeps two digits' room.
    await rerender(<CodeBlock code={lines(3)} />);
    expect(Math.abs(column() - widthOf("00"))).toBeLessThan(0.5);
  });

  it("shows code exactly as typed: ligatures off", async () => {
    await render(<CodeBlock code="<!-- a -> b != c -->" language="xml" />);
    const pre = document.querySelector("pre") as HTMLElement;
    expect(getComputedStyle(pre).fontVariantLigatures).toBe("none");
  });

  it("speaks Hindi through QeetrixProvider", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <CodeBlock code={"bun add a\nbun add b"} language="shell" />
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("button", { name: "कोड कॉपी करें" })).toBeVisible();
    await expect.element(page.getByText("शेल", { exact: true })).toBeVisible();
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(980, 560);
    const { container } = await render(
      <div
        data-qx-stage=""
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 24,
          alignItems: "start",
          padding: 16,
          inlineSize: 940,
          background: "var(--qx-color-surface-canvas)",
        }}
      >
        <Card title="Connect your React app" level={2}>
          <div style={{ display: "grid", gap: 12 }}>
            <CodeBlock code="bun add @qeetid/react" language="shell" />
            <CodeBlock code={SNIPPET} language="tsx" wrap />
          </div>
        </Card>
        <div style={{ display: "grid", gap: 24 }}>
          <Card title="Audit event" level={2}>
            <CodeBlock code={EVENT} language="json" />
          </Card>
          <Card title="SAML metadata" level={2}>
            <CodeBlock
              code={
                '<!-- Acme\'s identity provider -->\n<EntityDescriptor entityID="https://acme.id.qeet.in">\n  <SPSSODescriptor protocol="urn:oasis:names:tc:SAML:2.0" />\n</EntityDescriptor>'
              }
              language="xml"
            />
          </Card>
        </div>
      </div>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("CodeBlock", "[data-qx-stage]");
  });

  it("looks right wrapped, in every mode", async () => {
    await page.viewport(560, 360);
    const url = `"${"https://acme.id.qeet.in/oauth2/".repeat(3)}"`;
    const { container } = await render(
      <div
        data-qx-stage=""
        style={{ padding: 16, inlineSize: 360, background: "var(--qx-color-surface-canvas)" }}
      >
        <CodeBlock
          code={`{\n  "redirect_uris": [\n    ${url}\n  ],\n  "post_logout_redirect_uri": ${url}\n}`}
          language="json"
          wrap
        />
      </div>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("CodeBlock · wrapped", "[data-qx-stage]");
  });
});
