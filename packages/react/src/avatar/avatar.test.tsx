import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { inkOffset } from "../../tests/support/ink";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Inline } from "../inline/inline";
import { Avatar } from "./avatar";

describe("Avatar", () => {
  it("centres the initials' letters in the circle, at every size", async () => {
    document.documentElement.dataset.qxColorScheme = "light";
    await render(
      <div style={{ zoom: 8, display: "flex", gap: 2, padding: 2 }}>
        {(["sm", "md", "lg", "xl"] as const).map((size) => (
          <Avatar key={size} name="Priya Sharma" size={size} />
        ))}
      </div>,
    );
    for (const avatar of document.querySelectorAll<HTMLElement>("[data-slot=avatar]")) {
      const { vertical, horizontal } = await inkOffset(avatar, 8);
      // A quarter of a pixel at most: the eye can't tell.
      expect(Math.abs(vertical), `${avatar.dataset.size} vertical`).toBeLessThanOrEqual(0.25);
      expect(Math.abs(horizontal), `${avatar.dataset.size} horizontal`).toBeLessThanOrEqual(0.25);
    }
    delete document.documentElement.dataset.qxColorScheme;
  });

  it("is an image named for the person, showing their initials", async () => {
    await render(<Avatar name="Priya Sharma" />);
    const avatar = page.getByRole("img", { name: "Priya Sharma" });
    await expect.element(avatar).toHaveTextContent("PS");
  });

  it("keeps Indic graphemes whole", async () => {
    await render(<Avatar name="प्रिया शर्मा" />);
    await expect.element(page.getByRole("img", { name: "प्रिया शर्मा" })).toHaveTextContent("प्रिश");
  });

  it("is hidden from assistive technology when decorative", async () => {
    const { container } = await render(<Avatar name="Priya Sharma" decorative />);
    const avatar = container.querySelector("[data-slot=avatar]") as HTMLElement;
    expect(avatar.getAttribute("aria-hidden")).toBe("true");
    expect(avatar.getAttribute("role")).toBeNull();
  });

  it("is a circle at 24, 32, 40 and 48px", async () => {
    const { container } = await render(
      <>
        <Avatar name="A B" size="sm" />
        <Avatar name="A B" />
        <Avatar name="A B" size="lg" />
        <Avatar name="A B" size="xl" />
      </>,
    );
    const avatars = [...container.querySelectorAll("[data-slot=avatar]")] as HTMLElement[];
    expect(avatars.map((a) => a.getBoundingClientRect().width)).toEqual([24, 32, 40, 48]);
    expect(getComputedStyle(avatars[0] as HTMLElement).borderRadius).not.toBe("0px");
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <Inline gap="sm">
          <Avatar name="Priya Sharma" size="sm" />
          <Avatar name="Rahul Verma" />
          <Avatar name="Ananya Iyer" size="lg" />
          <Avatar name="Karthik" size="xl" />
        </Inline>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Avatar");
  });
});
