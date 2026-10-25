/**
 * The foundation primitives on the server: each renders without a browser, as the right element,
 * with its data attributes, and the render prop swaps the element without losing props.
 */
import { readFileSync } from "node:fs";
import { BREAKPOINT } from "@qeetrix/tokens";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Inline,
  Separator,
  SkipLink,
  Stack,
  Text,
  VisuallyHidden,
} from "../src/index";

const html = (node: React.ReactElement) => renderToString(node);

describe("foundations render on the server", () => {
  it("Box: a div with token data attributes", () => {
    expect(
      html(
        <Box padding="md" paddingInline="lg" background="raised" border="default" radius="surface">
          x
        </Box>,
      ),
    ).toBe(
      '<div class="qx-box" data-slot="box" data-padding="md" data-padding-inline="lg" data-background="raised" data-border="default" data-radius="surface">x</div>',
    );
  });

  it("Box: the render prop swaps the element and merges classes", () => {
    expect(
      html(<Box render={<section className="page" />} padding="sm" className="layout" />),
    ).toBe('<section class="qx-box layout page" data-slot="box" data-padding="sm"></section>');
  });

  it("Stack and Inline: default gaps md and sm; Inline can stop wrapping", () => {
    expect(html(<Stack />)).toBe('<div class="qx-stack" data-slot="stack" data-gap="md"></div>');
    expect(html(<Inline wrap={false} justify="between" />)).toBe(
      '<div class="qx-inline" data-slot="inline" data-gap="sm" data-justify="between" data-wrap="false"></div>',
    );
  });

  it("Grid: column counts become CSS variables, clamped to 1–12", () => {
    expect(html(<Grid columns={3} />)).toContain('style="--qx-grid-base:3"');
    const responsive = html(<Grid columns={{ base: 1, medium: 2, large: 4 }} />);
    expect(responsive).toContain("--qx-grid-base:1;--qx-grid-medium:2;--qx-grid-large:4");
    expect(responsive).not.toContain("--qx-grid-expanded");
    // Values arrive from props, so they are never trusted as-is.
    expect(html(<Grid columns={99 as 12} />)).toContain("--qx-grid-base:12");
  });

  it("GridItem: span and start become CSS variables, clamped to 1–12", () => {
    expect(html(<GridItem />)).toBe('<div class="qx-grid-item" data-slot="grid-item"></div>');
    expect(html(<GridItem span={{ base: 1, large: 2 }} start={3} />)).toContain(
      'style="--qx-grid-span-base:1;--qx-grid-span-large:2;--qx-grid-start-base:3"',
    );
    expect(html(<GridItem span={0 as 1} start={40 as 12} />)).toContain(
      "--qx-grid-span-base:1;--qx-grid-start-base:12",
    );
  });

  it("Stack, Inline and Grid: rendered as a list, they keep the list role", () => {
    expect(html(<Stack render={<ul />} />)).toContain('<ul role="list" class="qx-stack"');
    expect(html(<Inline render={<ol />} />)).toContain('<ol role="list" class="qx-inline"');
    expect(html(<Grid render={<ul />} />)).toContain('<ul role="list" class="qx-grid"');
    expect(html(<Grid render={<ul role="presentation" />} />)).toContain('role="presentation"');
    expect(html(<Stack render={<section />} />)).not.toContain("role=");
  });

  it("Text: a span by default, a paragraph through render", () => {
    expect(html(<Text tone="subtle">a</Text>)).toBe(
      '<span class="qx-text" data-slot="text" data-tone="subtle">a</span>',
    );
    expect(html(<Text render={<p />} size="lg" weight="semibold" mono />)).toBe(
      '<p class="qx-text" data-slot="text" data-size="lg" data-weight="semibold" data-mono=""></p>',
    );
  });

  it("Text and Heading: truncate is one line, or a number of lines", () => {
    expect(html(<Text truncate>a</Text>)).toContain('data-truncate="line"');
    const clamped = html(<Text truncate={3}>a</Text>);
    expect(clamped).toContain('data-truncate="lines"');
    expect(clamped).toContain("--qx-text-lines:3");
    expect(html(<Text truncate={false}>a</Text>)).not.toContain("data-truncate");
    expect(html(<Heading level={2} truncate={2} />)).toContain("--qx-text-lines:2");
  });

  it("Heading: the level sets the element; the size defaults by level", () => {
    expect(html(<Heading level={1}>Title</Heading>)).toBe(
      '<h1 class="qx-heading" data-slot="heading" data-size="heading-lg">Title</h1>',
    );
    expect(html(<Heading level={4} />)).toContain(
      '<h4 class="qx-heading" data-slot="heading" data-size="title-lg"',
    );
    expect(html(<Heading level={2} size="display-md" tone="subtle" />)).toBe(
      '<h2 class="qx-heading" data-slot="heading" data-size="display-md" data-tone="subtle"></h2>',
    );
  });

  it("Separator: a separator role, or none when decorative", () => {
    expect(html(<Separator />)).toBe(
      '<div role="separator" class="qx-separator" data-slot="separator" data-orientation="horizontal"></div>',
    );
    expect(html(<Separator orientation="vertical" tone="strong" />)).toContain(
      'aria-orientation="vertical"',
    );
    expect(html(<Separator decorative orientation="vertical" />)).toContain('role="none"');
    expect(html(<Separator decorative orientation="vertical" />)).not.toContain("aria-orientation");
  });

  it("VisuallyHidden and SkipLink", () => {
    expect(html(<VisuallyHidden>Close</VisuallyHidden>)).toBe(
      '<span class="qx-visually-hidden" data-slot="visually-hidden">Close</span>',
    );
    expect(html(<SkipLink />)).toBe(
      '<a href="#main" class="qx-skip-link" data-slot="skip-link">Skip to main content</a>',
    );
    expect(html(<SkipLink href="#content">Zum Inhalt springen</SkipLink>)).toContain(
      'href="#content" class="qx-skip-link" data-slot="skip-link">Zum Inhalt springen</a>',
    );
    // Server-safe: the label comes from a client leaf, so SkipLink itself has no directive.
    expect(html(<SkipLink messages={{ label: "मुख्य सामग्री पर जाएँ" }} />)).toContain(
      'data-slot="skip-link">मुख्य सामग्री पर जाएँ</a>',
    );
    expect(
      readFileSync(new URL("../src/skip-link/skip-link.tsx", import.meta.url), "utf8"),
    ).not.toMatch(/^["']use client["']/);
  });
});

describe("grid breakpoints", () => {
  it("equal the token breakpoints", () => {
    const css = readFileSync(new URL("../src/grid/grid.css", import.meta.url), "utf8");
    const used = [...css.matchAll(/@media \(width >= (\d+)px\)/g)].map((m) => Number(m[1]));
    expect(used).toEqual([
      BREAKPOINT.medium,
      BREAKPOINT.expanded,
      BREAKPOINT.large,
      BREAKPOINT.xlarge,
    ]);
  });
});
