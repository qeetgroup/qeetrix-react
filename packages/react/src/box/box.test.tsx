import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Box } from "./box";

describe("Box", () => {
  it("applies padding, background, border and corners from the tokens", async () => {
    const { container } = await render(
      <Box padding="md" paddingInline="xl" background="raised" border="default" radius="surface">
        Content
      </Box>,
    );
    const box = container.querySelector<HTMLElement>("[data-slot=box]");
    const style = getComputedStyle(box as HTMLElement);
    expect(style.paddingBlockStart).toBe("12px");
    expect(style.paddingInlineStart).toBe("24px");
    expect(style.borderTopWidth).toBe("1px");
    expect(style.borderTopLeftRadius).toBe("4px");
  });

  it("inverse sets the inverse text colour", async () => {
    const { container } = await render(<Box background="inverse">Inverse</Box>);
    const box = container.querySelector<HTMLElement>("[data-slot=box]") as HTMLElement;
    expect(getComputedStyle(box).color).not.toBe(getComputedStyle(document.body).color);
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <Box padding="lg" background="raised" border="default" radius="surface">
          Raised surface
        </Box>
        <Box padding="lg" background="brand" radius="control">
          Brand tint
        </Box>
        <Box padding="lg" background="inverse" radius="surface">
          Inverse
        </Box>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("Box");
  });
});
