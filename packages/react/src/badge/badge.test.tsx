import { CircleCheckIcon } from "@qeetrix/icons/icons/circle-check";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Inline } from "../inline/inline";
import { Badge, type BadgeTone } from "./badge";

const TONES: BadgeTone[] = ["neutral", "brand", "info", "success", "warning", "danger"];

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
