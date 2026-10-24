import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Box } from "../box/box";
import { Stack } from "./stack";

describe("Stack", () => {
  it("stacks children vertically with the token gap", async () => {
    const { container } = await render(
      <Stack gap="xl" align="center">
        <span>One</span>
        <span>Two</span>
      </Stack>,
    );
    const style = getComputedStyle(container.querySelector("[data-slot=stack]") as HTMLElement);
    expect(style.flexDirection).toBe("column");
    expect(style.rowGap).toBe("24px");
    expect(style.alignItems).toBe("center");
  });

  it("maps 2xl–4xl to the layout tokens", async () => {
    const { container } = await render(<Stack gap="4xl" />);
    expect(
      getComputedStyle(container.querySelector("[data-slot=stack]") as HTMLElement).rowGap,
    ).toBe("64px");
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <Stack gap="sm">
          {["First", "Second", "Third"].map((label) => (
            <Box key={label} padding="sm" background="neutral" radius="control">
              {label}
            </Box>
          ))}
        </Stack>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("Stack");
  });
});
