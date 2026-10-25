/**
 * The actions on the server: client components (Button, Toggle) still render to HTML, and the
 * server-safe ones (Link, Spinner) carry no client code.
 */
import { readFileSync } from "node:fs";
import { ArrowRightIcon } from "@qeetrix/icons/icons/arrow-right";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button, IconButton, Link, Spinner, Toggle, ToggleGroup } from "../src/index";
import { hi } from "../src/locales/hi";
import { QeetrixProvider } from "../src/provider/provider";

const html = (node: React.ReactElement) => renderToString(node);

describe("actions render on the server", () => {
  it("Button: label first, a sharp trailing icon, type=button", () => {
    const out = html(<Button icon={ArrowRightIcon}>Continue</Button>);
    expect(out).toMatch(/^<button type="button"/);
    expect(out).toContain(
      'data-slot="button" data-variant="solid" data-tone="brand" data-size="md" data-icon=""',
    );
    expect(out.indexOf("button-label")).toBeLessThan(out.indexOf("button-icon"));
    expect(out).toContain('stroke-linecap="square"');
  });

  it("Button: loading sets aria-busy and keeps the button focusable", () => {
    const out = html(<Button loading>Save</Button>);
    expect(out).toContain('aria-busy="true"');
    expect(out).toContain('aria-disabled="true"');
    expect(out).toContain('data-slot="spinner"');
    expect(out).not.toMatch(/ disabled=""/);
    // The spinner sits in its own slot in the button, keeping Spinner's slot inside it.
    expect(out).toMatch(/data-slot="button-spinner"><span[^>]*data-slot="spinner"/);
  });

  it("IconButton: named by its aria-label", () => {
    expect(html(<IconButton icon={ArrowRightIcon} aria-label="Next" />)).toContain(
      'aria-label="Next"',
    );
  });

  it("Toggle and ToggleGroup", () => {
    expect(html(<Toggle defaultPressed>Bold</Toggle>)).toContain('aria-pressed="true"');
    expect(html(<ToggleGroup aria-label="View" />)).toContain('data-variant="segmented"');
    // An icon-only toggle's tooltip adds no element of its own.
    expect(html(<Toggle icon={ArrowRightIcon} aria-label="Next" />)).toMatch(
      /^<button[^>]*aria-label="Next"[^>]*data-slot="toggle"[^>]*data-icon-only=""/,
    );
  });

  it("Link: external adds rel, target and the screen-reader note", () => {
    const out = html(
      <Link href="https://qeet.in" external rel="author">
        Qeet
      </Link>,
    );
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="author noopener noreferrer"');
    expect(out).toContain("(opens in a new tab)");
  });

  it("Spinner: a named status, or hidden when decorative", () => {
    const out = html(<Spinner />);
    const id = out.match(/aria-labelledby="([^"]+)"/)?.[1];
    expect(out).toMatch(/^<span role="status" aria-labelledby="[^"]+" class="qx-spinner"/);
    expect(out).toContain(`<span id="${id}" hidden="" data-slot="spinner-label">Loading</span>`);
    expect(html(<Spinner label="Loading invoices" />)).toBe(
      '<span role="status" aria-label="Loading invoices" class="qx-spinner" data-slot="spinner"></span>',
    );
    expect(html(<Spinner decorative />)).toContain('aria-hidden="true"');
  });

  it("Spinner stays server-safe, and says the provider's language when rendered on the server", () => {
    const source = readFileSync(new URL("../src/spinner/spinner.tsx", import.meta.url), "utf8");
    expect(source).not.toMatch(/^["']use client["']/);
    const out = html(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <Spinner />
      </QeetrixProvider>,
    );
    expect(out).toContain(">लोड हो रहा है</span>");
  });

  it("Spinner keeps the wait visible under reduced motion", () => {
    const css = readFileSync(new URL("../src/spinner/spinner.css", import.meta.url), "utf8");
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation: qx-spinner-fade/,
    );
  });
});
