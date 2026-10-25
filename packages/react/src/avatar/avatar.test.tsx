import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { inkOffset } from "../../tests/support/ink";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Inline } from "../inline/inline";
import { Avatar, type AvatarShape } from "./avatar";

const SIZES = ["sm", "md", "lg", "xl"] as const;
const SHAPES: AvatarShape[] = ["circle", "square"];

/** A square logo: an organisation's mark on its brand colour (domain data, not a Qeetrix colour). */
const LOGO = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#0b5cad"/><path d="M14 34 24 12l10 22h-6l-4-9-4 9z" fill="#fff"/></svg>',
)}`;

describe("Avatar", () => {
  it("centres the initials' letters in either shape, at every size", async () => {
    document.documentElement.dataset.qxColorScheme = "light";
    await render(
      <div style={{ zoom: 8, display: "flex", gap: 2, padding: 2 }}>
        {SHAPES.flatMap((shape) =>
          SIZES.map((size) => (
            <Avatar key={shape + size} name="Priya Sharma" size={size} shape={shape} />
          )),
        )}
      </div>,
    );
    for (const avatar of document.querySelectorAll<HTMLElement>("[data-slot=avatar]")) {
      const { vertical, horizontal } = await inkOffset(avatar, 8);
      const which = `${avatar.dataset.shape} ${avatar.dataset.size}`;
      // A quarter of a pixel at most: the eye can't tell.
      expect(Math.abs(vertical), `${which} vertical`).toBeLessThanOrEqual(0.25);
      expect(Math.abs(horizontal), `${which} horizontal`).toBeLessThanOrEqual(0.25);
    }
    delete document.documentElement.dataset.qxColorScheme;
  });

  it("keeps the A11y letterforms at every size, after the larger sizes' font", async () => {
    // Regression: `font` resets font-variation-settings, and lg/xl set it after the geometry.
    const { container } = await render(
      <div>
        {SIZES.map((size) => (
          <Avatar key={size} name="Priya Sharma" size={size} />
        ))}
      </div>,
    );
    const fonts = [...container.querySelectorAll<HTMLElement>("[data-slot=avatar]")].map((avatar) =>
      getComputedStyle(avatar),
    );
    expect(fonts.map((style) => style.fontSize)).toEqual(["12px", "12px", "14px", "14px"]);
    for (const style of fonts) expect(style.fontVariationSettings).toBe('"GEOM" 0');
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

  it("is a square with the controls' 4px corners for an organisation, at every size", async () => {
    const { container } = await render(
      <div>
        {SIZES.map((size) => (
          <Avatar key={size} name="Acme Pvt Ltd" size={size} shape="square" />
        ))}
      </div>,
    );
    const avatars = [...container.querySelectorAll<HTMLElement>("[data-slot=avatar]")];
    expect(avatars.map((a) => a.getBoundingClientRect().width)).toEqual([24, 32, 40, 48]);
    expect(avatars.map((a) => a.getBoundingClientRect().height)).toEqual([24, 32, 40, 48]);
    for (const avatar of avatars) {
      expect(avatar.dataset.shape).toBe("square");
      expect(getComputedStyle(avatar).borderRadius).toBe("4px");
      expect(avatar.textContent).toBe("AL");
    }
    await expect.element(page.getByRole("img", { name: "Acme Pvt Ltd" }).first()).toBeVisible();
  });

  it("shows the photo or logo in either shape, filling it and clipped to its corners", async () => {
    const { container } = await render(
      <>
        <Avatar name="Priya Sharma" src={LOGO} size="xl" />
        <Avatar name="Acme Pvt Ltd" src={LOGO} size="xl" shape="square" />
      </>,
    );
    await expect.poll(() => container.querySelectorAll("img").length).toBe(2);
    for (const avatar of container.querySelectorAll<HTMLElement>("[data-slot=avatar]")) {
      const image = avatar.querySelector("img") as HTMLImageElement;
      await expect.poll(() => image.complete && image.naturalWidth > 0).toBe(true);
      expect(image.getBoundingClientRect().toJSON()).toEqual(
        avatar.getBoundingClientRect().toJSON(),
      );
      expect(getComputedStyle(avatar).overflow).toBe("hidden");
      // The initials step aside once the image has loaded.
      expect(avatar.querySelector(".qx-avatar-fallback")).toBeNull();
    }
    const [person, organisation] = container.querySelectorAll<HTMLElement>("[data-slot=avatar]");
    expect(getComputedStyle(person as HTMLElement).borderRadius).not.toBe("4px");
    expect(getComputedStyle(organisation as HTMLElement).borderRadius).toBe("4px");
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

  it("is accessible and looks right as a square, beside the circle, in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <div style={{ display: "grid", gap: 12 }}>
          {SHAPES.map((shape) => (
            <Inline key={shape} gap="sm">
              {SIZES.map((size) => (
                <Avatar
                  key={size}
                  name={shape === "circle" ? "Priya Sharma" : "Acme Pvt Ltd"}
                  size={size}
                  shape={shape}
                />
              ))}
              <Avatar name="Qeet Pay" src={LOGO} size="xl" shape={shape} />
            </Inline>
          ))}
        </div>
      </Stage>,
    );
    await expect.poll(() => container.querySelectorAll("img").length).toBe(2);
    await expectAccessible(container);
    await screenshotSchemes("Avatar · shapes");
  });
});
