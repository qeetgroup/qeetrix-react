import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
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

  it("drops a list's bullets and indent when it renders one, and keeps the list role", async () => {
    const { container } = await render(
      <>
        <ul data-testid="plain">
          <li>Plain</li>
        </ul>
        <Inline render={<ul />}>
          <li>Paid</li>
          <li>Due</li>
        </Inline>
      </>,
    );
    // No CSS reset is loaded on the test page: a plain list keeps the browser's margin and indent.
    const plain = getComputedStyle(container.querySelector("[data-testid=plain]") as HTMLElement);
    expect(plain.paddingInlineStart).toBe("40px");
    expect(plain.marginBlockStart).not.toBe("0px");
    const list = container.querySelector("[data-slot=inline]") as HTMLElement;
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
