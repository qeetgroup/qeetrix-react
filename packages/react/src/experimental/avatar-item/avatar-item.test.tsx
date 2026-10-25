import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { AvatarItem } from "./avatar-item";

describe("AvatarItem", () => {
  it("shows the name over the second line, and hides the avatar from assistive technology", async () => {
    const { container } = await render(
      <AvatarItem name="Priya Sharma" description="priya@acme.in" />,
    );
    await expect.element(page.getByText("Priya Sharma")).toBeVisible();
    await expect.element(page.getByText("priya@acme.in")).toBeVisible();
    expect(container.querySelector("[data-slot=avatar]")?.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector(".qx-avatar-fallback")?.textContent).toBe("PS");
  });

  it("keeps the two lines close: together as tall as a md avatar", async () => {
    const { container } = await render(
      <AvatarItem name="Priya Sharma" description="priya@acme.in" />,
    );
    const lines = container.querySelector(".qx-avatar-item-text") as HTMLElement;
    const avatar = container.querySelector("[data-slot=avatar]") as HTMLElement;
    // To the pixel: the line height is a ratio, 16 × 1.3333.
    expect(lines.getBoundingClientRect().height).toBeCloseTo(32, 0);
    expect(avatar.getBoundingClientRect().height).toBe(32);
  });

  it("ends long text with an ellipsis where the space runs out", async () => {
    const { container } = await render(
      <div style={{ inlineSize: 160 }}>
        <AvatarItem
          name="Venkata Lakshmi Narasimhan"
          description="venkata.lakshmi.narasimhan@acme.in"
        />
      </div>,
    );
    for (const line of container.querySelectorAll<HTMLElement>(".qx-avatar-item-text > span")) {
      expect(line.scrollWidth).toBeGreaterThan(line.clientWidth);
      expect(getComputedStyle(line).textOverflow).toBe("ellipsis");
    }
  });

  it("lines names up down a list, and centres the avatar on the text", async () => {
    const { container } = await render(
      <div style={{ display: "grid", gap: 8 }}>
        <AvatarItem name="Priya Sharma" description="priya@acme.in" />
        <AvatarItem name="Ananya Iyer" />
      </div>,
    );
    const names = [...container.querySelectorAll(".qx-avatar-item-name")].map(
      (name) => name.getBoundingClientRect().left,
    );
    expect(new Set(names).size).toBe(1);
    for (const item of container.querySelectorAll(".qx-avatar-item")) {
      const avatar = (
        item.querySelector("[data-slot=avatar]") as HTMLElement
      ).getBoundingClientRect();
      const text = (
        item.querySelector(".qx-avatar-item-text") as HTMLElement
      ).getBoundingClientRect();
      const middle = (rect: DOMRect) => rect.top + rect.height / 2;
      expect(Math.abs(middle(avatar) - middle(text))).toBeLessThan(0.5);
    }
  });

  it("keeps the A11y letterforms on both lines, after each line's font", async () => {
    // Regression: each line set the `font` shorthand after the geometry, which reset it.
    const { container } = await render(
      <AvatarItem name="Priya Sharma" description="priya@acme.in" />,
    );
    for (const line of container.querySelectorAll<HTMLElement>(".qx-avatar-item-text > span")) {
      expect(getComputedStyle(line).fontVariationSettings).toBe('"GEOM" 0');
    }
  });

  it("takes a square avatar for an organisation or application", async () => {
    const { container } = await render(
      <AvatarItem name="Acme Pvt Ltd" description="acme.qeet.in" shape="square" />,
    );
    const avatar = container.querySelector("[data-slot=avatar]") as HTMLElement;
    expect(avatar.dataset.shape).toBe("square");
    expect(getComputedStyle(avatar).borderRadius).toBe("4px");
    expect(avatar.getAttribute("aria-hidden")).toBe("true");
  });

  it("is accessible and looks right in both colour schemes", async () => {
    const { container } = await render(
      <Stage>
        <div style={{ display: "grid", gap: 24, inlineSize: 520 }}>
          {/* One size down a list, as a list uses it. */}
          <div style={{ display: "grid", gap: 12, inlineSize: 280 }}>
            <AvatarItem name="Priya Sharma" description="priya@acme.in" />
            <AvatarItem name="Rahul Verma" description="Administrator" />
            <AvatarItem name="Ananya Iyer" />
            <AvatarItem
              name="Venkata Lakshmi Narasimhan"
              description="venkata.lakshmi.narasimhan@acme.in"
            />
          </div>
          {/* The sizes, side by side. */}
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <AvatarItem name="Priya Sharma" size="sm" />
            <AvatarItem name="Priya Sharma" description="priya@acme.in" />
            <AvatarItem name="Priya Sharma" description="priya@acme.in" size="lg" />
          </div>
        </div>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("AvatarItem", "[data-qx-stage]");
  });

  it("is accessible and looks right with square avatars, in both colour schemes", async () => {
    const { container } = await render(
      <Stage>
        <div style={{ display: "grid", gap: 12, inlineSize: 280 }}>
          <AvatarItem name="Acme Pvt Ltd" description="acme.qeet.in" shape="square" />
          <AvatarItem name="Qeet Pay" description="Payments application" shape="square" />
          <AvatarItem name="Globex Tenant" shape="square" size="sm" />
          <AvatarItem name="Initech" description="initech.qeet.in" shape="square" size="lg" />
        </div>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("AvatarItem · square");
  });
});
