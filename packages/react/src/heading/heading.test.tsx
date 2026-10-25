import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Stack } from "../stack/stack";
import { Heading } from "./heading";

describe("Heading", () => {
  it("is a real heading at its level, whatever its size", async () => {
    await render(
      <Heading level={2} size="display-sm">
        Payments
      </Heading>,
    );
    await expect.element(page.getByRole("heading", { level: 2, name: "Payments" })).toBeVisible();
  });

  it("uses Base letterforms for headings and Geo for display", async () => {
    const { container } = await render(
      <>
        <Heading level={1} size="display-lg">
          Display
        </Heading>
        <Heading level={2}>Heading</Heading>
      </>,
    );
    const [display, heading] = [...container.querySelectorAll("[data-slot=heading]")].map((el) =>
      getComputedStyle(el),
    );
    expect(display?.fontVariationSettings).toContain('"GEOM" 100');
    expect(heading?.fontVariationSettings).toContain('"GEOM" 50');
    expect(heading?.fontWeight).toBe("600");
    expect(heading?.fontSize).toBe("28px");
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <Stack gap="sm">
          <Heading level={1} size="display-sm">
            Payments for India
          </Heading>
          <Heading level={2}>One system for every product</Heading>
          <Heading level={3}>Invoices</Heading>
          <Heading level={4}>Invoice INV-2026-0142</Heading>
          <Heading level={5} tone="subtle">
            Line items
          </Heading>
        </Stack>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Heading");
  });
});
