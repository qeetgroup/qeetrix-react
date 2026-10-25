/**
 * The actions on the server: client components (Button, Toggle) still render to HTML, and the
 * server-safe ones (Link, Spinner) carry no client code.
 */
import { readFileSync } from "node:fs";
import { ArrowRightIcon } from "@qeetrix/icons/icons/arrow-right";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button, IconButton, Link, Spinner, Toggle, ToggleGroup } from "../src/index";

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
  });

  it("IconButton: named by its aria-label", () => {
    expect(html(<IconButton icon={ArrowRightIcon} aria-label="Next" />)).toContain(
      'aria-label="Next"',
    );
  });

  it("Toggle and ToggleGroup", () => {
    expect(html(<Toggle defaultPressed>Bold</Toggle>)).toContain('aria-pressed="true"');
    expect(html(<ToggleGroup aria-label="View" />)).toContain('data-variant="segmented"');
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
    expect(html(<Spinner />)).toBe(
      '<span role="status" aria-label="Loading" class="qx-spinner" data-slot="spinner"></span>',
    );
    expect(html(<Spinner decorative />)).toContain('aria-hidden="true"');
  });

  it("Spinner keeps the wait visible under reduced motion", () => {
    const css = readFileSync(new URL("../src/spinner/spinner.css", import.meta.url), "utf8");
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation: qx-spinner-fade/,
    );
  });
});
