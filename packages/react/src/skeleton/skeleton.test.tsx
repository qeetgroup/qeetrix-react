import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Avatar } from "../avatar/avatar";
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

  it("is a paragraph with lines: as tall as the text it stands for, the last line shorter", async () => {
    const { container } = await render(
      <div style={{ inlineSize: 300, font: "var(--qx-typography-body-md)" }}>
        <Skeleton lines={3} />
        <p style={{ margin: 0 }}>
          One line of text
          <br />
          and another
          <br />
          and a third.
        </p>
      </div>,
    );
    const group = container.querySelector("[data-slot=skeleton-lines]") as HTMLElement;
    const text = container.querySelector("p") as HTMLElement;
    expect(group.getAttribute("aria-hidden")).toBe("true");
    const lines = [...group.querySelectorAll<HTMLElement>("[data-slot=skeleton]")];
    expect(lines).toHaveLength(3);
    // Three 20px lines: 60px, like the paragraph.
    expect(group.getBoundingClientRect().height).toBeCloseTo(
      text.getBoundingClientRect().height,
      1,
    );
    expect(group.getBoundingClientRect().height).toBeCloseTo(60, 1);
    // Each bar is centred in its line.
    const top = group.getBoundingClientRect().top;
    lines.forEach((line, index) => {
      const rect = line.getBoundingClientRect();
      expect(rect.height).toBeCloseTo(14, 1);
      expect(rect.top - top + rect.height / 2).toBeCloseTo(10 + index * 20, 1);
    });
    expect((lines[2] as HTMLElement).getBoundingClientRect().width).toBeCloseTo(180, 1);
    expect((lines[0] as HTMLElement).getBoundingClientRect().width).toBe(300);
  });

  it("takes Avatar's sizes as a circle: 24, 32, 40 and 48px", async () => {
    const { container } = await render(
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Skeleton variant="circle" size="sm" />
        <Skeleton variant="circle" />
        <Skeleton variant="circle" size="lg" />
        <Skeleton variant="circle" size="xl" />
        <Avatar name="Priya Sharma" size="xl" />
      </div>,
    );
    const sizes = [...container.querySelectorAll<HTMLElement>("[data-slot=skeleton]")].map(
      (circle) => {
        const rect = circle.getBoundingClientRect();
        return [rect.width, rect.height];
      },
    );
    expect(sizes).toEqual([
      [24, 24],
      [32, 32],
      [40, 40],
      [48, 48],
    ]);
    const avatar = (
      container.querySelector("[data-slot=avatar]") as HTMLElement
    ).getBoundingClientRect();
    expect([avatar.width, avatar.height]).toEqual([48, 48]);
  });

  it("looks right as a paragraph and in every circle size, in both schemes", async () => {
    await render(
      <Stage>
        <Stack gap="md" style={{ inlineSize: 280 }}>
          <Inline gap="sm" align="center">
            <Skeleton variant="circle" size="sm" />
            <Skeleton variant="circle" />
            <Skeleton variant="circle" size="lg" />
            <Skeleton variant="circle" size="xl" />
          </Inline>
          <Skeleton lines={3} />
        </Stack>
      </Stage>,
    );
    await screenshotSchemes("Skeleton · lines and circles");
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
