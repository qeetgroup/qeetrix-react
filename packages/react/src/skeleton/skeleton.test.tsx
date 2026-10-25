import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Inline } from "../inline/inline";
import { Stack } from "../stack/stack";
import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("is hidden from assistive technology and pulses", async () => {
    const { container } = await render(<Skeleton />);
    const skeleton = container.querySelector("[data-slot=skeleton]") as HTMLElement;
    expect(skeleton.getAttribute("aria-hidden")).toBe("true");
    expect(getComputedStyle(skeleton).animationName).toBe("qx-skeleton-pulse");
  });

  it("takes a line's height as text, and 32px as a circle", async () => {
    const { container } = await render(
      <div style={{ font: "var(--qx-typography-body-md)" }}>
        <Skeleton />
        <Skeleton variant="circle" />
      </div>,
    );
    const [text, circle] = [...container.querySelectorAll("[data-slot=skeleton]")] as HTMLElement[];
    expect(text?.getBoundingClientRect().height).toBeCloseTo(20, 0);
    expect(circle?.getBoundingClientRect().width).toBe(32);
  });

  it("looks right in both schemes", async () => {
    await render(
      <Stage>
        <Stack gap="md" style={{ inlineSize: 280 }}>
          <Inline gap="sm">
            <Skeleton variant="circle" />
            <Stack gap="xs" style={{ flex: 1 }}>
              <Skeleton style={{ inlineSize: "60%" }} />
              <Skeleton style={{ inlineSize: "40%" }} />
            </Stack>
          </Inline>
          <Skeleton variant="block" />
        </Stack>
      </Stage>,
    );
    await screenshotSchemes("Skeleton");
  });
});
