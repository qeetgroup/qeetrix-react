import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotSchemes } from "../../tests/support/screenshots";
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

  it("drops a list's bullets and indent when it renders one, and keeps the list role", async () => {
    const { container } = await render(
      <>
        <ul data-testid="plain">
          <li>Plain</li>
        </ul>
        <Stack render={<ul />}>
          <li>Paid</li>
          <li>Due</li>
        </Stack>
      </>,
    );
    // No CSS reset is loaded on the test page: a plain list keeps the browser's margin and indent.
    const plain = getComputedStyle(container.querySelector("[data-testid=plain]") as HTMLElement);
    expect(plain.paddingInlineStart).toBe("40px");
    expect(plain.marginBlockStart).not.toBe("0px");
    const list = container.querySelector("[data-slot=stack]") as HTMLElement;
    const style = getComputedStyle(list);
    expect([style.marginBlockStart, style.marginBlockEnd, style.paddingInlineStart]).toEqual([
      "0px",
      "0px",
      "0px",
    ]);
    const first = list.firstElementChild as HTMLElement;
    expect(getComputedStyle(first).listStyleType).toBe("none");
    expect(first.getBoundingClientRect().left).toBe(list.getBoundingClientRect().left);
    expect(first.getBoundingClientRect().top).toBe(list.getBoundingClientRect().top);
    expect(list.getAttribute("role")).toBe("list");
    expect(page.getByRole("listitem").elements()).toHaveLength(3);
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
    await screenshotSchemes("Stack");
  });
});
