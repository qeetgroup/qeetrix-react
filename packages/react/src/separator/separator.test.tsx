import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Inline } from "../inline/inline";
import { Stack } from "../stack/stack";
import { Text } from "../text/text";
import { Separator } from "./separator";

describe("Separator", () => {
  it("is a 1px separator, horizontal by default", async () => {
    const { container } = await render(<Separator />);
    await expect.element(page.getByRole("separator")).toBeInTheDocument();
    expect(
      getComputedStyle(container.querySelector("[data-slot=separator]") as HTMLElement).height,
    ).toBe("1px");
  });

  it("is hidden from assistive technology when decorative", async () => {
    await render(<Separator decorative />);
    expect(page.getByRole("separator").elements()).toHaveLength(0);
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <Stack gap="md">
          <Text>Above</Text>
          <Separator />
          <Inline gap="md" align="stretch">
            <Text>Left</Text>
            <Separator orientation="vertical" tone="strong" />
            <Text>Right</Text>
          </Inline>
        </Stack>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Separator");
  });
});
