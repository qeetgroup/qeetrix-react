import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Box } from "../box/box";
import { Inline } from "./inline";

describe("Inline", () => {
  it("lays children out in a wrapping row with the token gap", async () => {
    const { container } = await render(
      <Inline gap="md" justify="between">
        <span>A</span>
        <span>B</span>
      </Inline>,
    );
    const style = getComputedStyle(container.querySelector("[data-slot=inline]") as HTMLElement);
    expect(style.flexDirection).toBe("row");
    expect(style.flexWrap).toBe("wrap");
    expect(style.columnGap).toBe("12px");
    expect(style.justifyContent).toBe("space-between");
  });

  it("can stop wrapping", async () => {
    const { container } = await render(<Inline wrap={false} />);
    expect(
      getComputedStyle(container.querySelector("[data-slot=inline]") as HTMLElement).flexWrap,
    ).toBe("nowrap");
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <Inline gap="sm">
          {["Paid", "Due", "Overdue", "Draft"].map((label) => (
            <Box
              key={label}
              paddingInline="sm"
              paddingBlock="xs"
              background="neutral"
              radius="chip"
            >
              {label}
            </Box>
          ))}
        </Inline>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Inline");
  });
});
