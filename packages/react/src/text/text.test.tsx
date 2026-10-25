import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Stack } from "../stack/stack";
import { Text } from "./text";

const styleOf = (container: HTMLElement, slot = "text") =>
  getComputedStyle(container.querySelector(`[data-slot=${slot}]`) as HTMLElement);
// Line heights are unitless ratios in the tokens (1.4286 × 14px = 20.0004px): equal to a hundredth.
const px = (value: string) => Math.round(Number.parseFloat(value) * 100) / 100;

describe("Text", () => {
  it("uses the body roles: 14/20 by default, 12/16 and 16/24 by size", async () => {
    const md = await render(<Text>Body</Text>);
    expect(styleOf(md.container).fontSize).toBe("14px");
    expect(px(styleOf(md.container).lineHeight)).toBe(20);
    const sm = await render(<Text size="sm">Small</Text>);
    expect(styleOf(sm.container).fontSize).toBe("12px");
    const lg = await render(<Text size="lg">Large</Text>);
    expect(px(styleOf(lg.container).lineHeight)).toBe(24);
  });

  it("sets weight, monospace and the A11y letterforms", async () => {
    const { container } = await render(
      <Text weight="semibold" mono>
        acc_7f3k29
      </Text>,
    );
    const style = styleOf(container);
    expect(style.fontWeight).toBe("600");
    expect(style.fontFamily).toContain("Fira Code");
    expect(style.fontVariationSettings).toContain('"GEOM" 0');
  });

  it("truncates one line with an ellipsis, or clamps to a number of lines", async () => {
    const one = await render(<Text truncate>Long text</Text>);
    expect(styleOf(one.container).textOverflow).toBe("ellipsis");
    const three = await render(<Text truncate={3}>Long text</Text>);
    expect(styleOf(three.container).webkitLineClamp).toBe("3");
  });

  it("keeps the disabled tone to inactive controls: exempt there, a contrast failure elsewhere", async () => {
    // WCAG 1.4.3 exempts the text of an inactive component; plain Text isn't one. The check stays
    // on: the tone passes where the control says it's inactive, and fails where nothing does.
    const { container } = await render(
      <Stage>
        <Stack gap="xs">
          <button type="button" aria-disabled="true">
            <Text tone="disabled">Enterprise plan (contact sales)</Text>
          </button>
          <button type="button" disabled>
            <Text tone="disabled">Export</Text>
          </button>
        </Stack>
      </Stage>,
    );
    await expectAccessible(container);
    const loose = await render(<Text tone="disabled">Not part of any control</Text>);
    const result = await axe.run(loose.container, { runOnly: ["color-contrast"] });
    expect(result.violations.map((violation) => violation.id)).toEqual(["color-contrast"]);
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <Stack gap="xs">
          <Text size="lg">Payments, people and identity on one platform.</Text>
          <Text>Body text: ₹1,24,500.00 received on 24 Oct 2026.</Text>
          <Text size="sm" tone="subtle">
            Supporting text in the subtle tone.
          </Text>
          <Text tone="danger">That PAN has 10 characters.</Text>
          <Text mono>qk_live_3f9a</Text>
        </Stack>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Text");
  });
});
