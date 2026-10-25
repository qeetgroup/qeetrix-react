import { CircleCheckIcon } from "@qeetrix/icons/icons/circle-check";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Inline } from "../inline/inline";
import { Badge, type BadgeSize, type BadgeTone, type BadgeVariant } from "./badge";

const TONES: BadgeTone[] = ["neutral", "brand", "info", "success", "warning", "danger"];
const VARIANTS: BadgeVariant[] = ["subtle", "solid"];
const SIZES: BadgeSize[] = ["md", "sm"];
const word = (tone: string) => tone[0]?.toUpperCase() + tone.slice(1);

/** The solid fill and its text, per tone: on-bold text, dark on warning, inverse on graphite. */
const SOLID: Record<BadgeTone, [`--qx-${string}`, `--qx-${string}`]> = {
  neutral: ["--qx-color-bg-neutral-bold", "--qx-color-text-inverse"],
  brand: ["--qx-color-bg-brand-bold", "--qx-color-text-on-brand"],
  info: ["--qx-color-bg-info-bold", "--qx-color-text-on-bold"],
  success: ["--qx-color-bg-success-bold", "--qx-color-text-on-bold"],
  warning: ["--qx-color-bg-warning-bold", "--qx-color-text-on-warning"],
  danger: ["--qx-color-bg-danger-bold", "--qx-color-text-on-bold"],
};

/** Every tone in both variants and both sizes, as a status column would mix them. */
function Matrix() {
  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "max-content" }}>
      {SIZES.flatMap((size) =>
        VARIANTS.map((variant) => (
          <Inline key={size + variant} gap="sm">
            {TONES.map((tone) => (
              <Badge key={tone} tone={tone} variant={variant} size={size}>
                {word(tone)}
              </Badge>
            ))}
            <Badge tone="success" variant={variant} size={size} icon={CircleCheckIcon}>
              Paid
            </Badge>
          </Inline>
        )),
      )}
    </div>
  );
}

describe("Badge", () => {
  it("is a pill with its word, and a sharp decorative icon", async () => {
    const { container } = await render(
      <Badge tone="success" icon={CircleCheckIcon}>
        Paid
      </Badge>,
    );
    const badge = container.querySelector("[data-slot=badge]") as HTMLElement;
    expect(badge.textContent).toBe("Paid");
    expect(getComputedStyle(badge).borderRadius).not.toBe("0px");
    const icon = badge.querySelector("svg") as SVGElement;
    expect(icon.getAttribute("aria-hidden")).toBe("true");
    expect(icon.getAttribute("width")).toBe("12");
  });

  it("truncates with an ellipsis when its space runs out", async () => {
    const { container } = await render(
      <div style={{ inlineSize: 60 }}>
        <Badge title="Awaiting approval">Awaiting approval</Badge>
      </div>,
    );
    const label = container.querySelector(".qx-badge-label") as HTMLElement;
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    expect(getComputedStyle(label).textOverflow).toBe("ellipsis");
  });

  it("is subtle and md by default", async () => {
    const { container } = await render(<Badge>Draft</Badge>);
    const badge = container.querySelector("[data-slot=badge]") as HTMLElement;
    expect(badge.dataset.variant).toBe("subtle");
    expect(badge.dataset.size).toBe("md");
    expect(getComputedStyle(badge).backgroundColor).toBe(
      tokenColor("--qx-color-bg-neutral-subtle-pressed"),
    );
  });

  it("fills solid badges with the tone's bold colour and on-bold text, in both schemes", async () => {
    const { container } = await render(
      <div>
        {TONES.map((tone) => (
          <Badge key={tone} tone={tone} variant="solid">
            {word(tone)}
          </Badge>
        ))}
      </div>,
    );
    for (const scheme of ["light", "dark"] as const) {
      document.documentElement.dataset.qxColorScheme = scheme;
      for (const badge of container.querySelectorAll<HTMLElement>("[data-slot=badge]")) {
        const [fill, text] = SOLID[badge.dataset.tone as BadgeTone];
        const style = getComputedStyle(badge);
        expect(style.backgroundColor, `${scheme} ${badge.dataset.tone}`).toBe(tokenColor(fill));
        expect(style.color, `${scheme} ${badge.dataset.tone}`).toBe(tokenColor(text));
      }
    }
    delete document.documentElement.dataset.qxColorScheme;
  });

  it("is 20px at md and 16px at sm, with or without an icon", async () => {
    const { container } = await render(
      <>
        {SIZES.flatMap((size) =>
          VARIANTS.map((variant) => (
            <Badge key={size + variant} size={size} variant={variant} icon={CircleCheckIcon}>
              Paid
            </Badge>
          )),
        )}
        <Badge size="sm">Paid</Badge>
      </>,
    );
    // To the pixel: the line height is a ratio, 12 × 1.3333.
    const heights = [...container.querySelectorAll<HTMLElement>("[data-slot=badge]")].map((badge) =>
      Math.round(badge.getBoundingClientRect().height),
    );
    expect(heights).toEqual([20, 20, 16, 16, 16]);
    // The label and its icon share the pill's centre line at both sizes.
    for (const badge of container.querySelectorAll<HTMLElement>("[data-slot=badge]")) {
      const icon = badge.querySelector("[data-slot=badge-icon]");
      if (!icon) continue;
      const centre = (rect: DOMRect) => rect.top + rect.height / 2;
      const pill = badge.getBoundingClientRect();
      expect(Math.abs(centre(icon.getBoundingClientRect()) - centre(pill))).toBeLessThanOrEqual(
        0.5,
      );
    }
  });

  it("passes axe in every tone, variant and size, in light and dark", async () => {
    const { container } = await render(
      <Stage>
        <Matrix />
      </Stage>,
    );
    for (const scheme of ["light", "dark"] as const) {
      document.documentElement.dataset.qxColorScheme = scheme;
      await expectAccessible(container);
    }
    delete document.documentElement.dataset.qxColorScheme;
    await screenshotSchemes("Badge · variants and sizes");
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <Inline gap="sm">
          {TONES.map((tone) => (
            <Badge key={tone} tone={tone}>
              {tone[0]?.toUpperCase() + tone.slice(1)}
            </Badge>
          ))}
          <Badge tone="success" icon={CircleCheckIcon}>
            Paid
          </Badge>
        </Inline>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Badge");
  });
});
