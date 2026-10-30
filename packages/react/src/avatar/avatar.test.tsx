import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
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

  it("leaves out an organisation's legal form: Acme Pvt Ltd is AC, Nimbus Labs LLP is NL", async () => {
    const names: Record<string, string> = {
      "Acme Pvt Ltd": "AC",
      "Acme Pvt. Ltd.": "AC",
      "Kaveri Foods Private Limited": "KF",
      "Nimbus Labs LLP": "NL",
      "Qeet Group": "QG",
      Priya: "P",
    };
    await render(
      <div>
        {Object.keys(names).map((name) => (
          <Avatar key={name} name={name} shape="square" />
        ))}
      </div>,
    );
    for (const [name, letters] of Object.entries(names)) {
      await expect.element(page.getByRole("img", { name })).toHaveTextContent(letters);
    }
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
      expect(avatar.textContent).toBe("AC");
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

  it("status: a dot on the bottom-end corner, read with the name (QTRX-181)", async () => {
    const { container } = await render(
      <>
        {SIZES.map((size) => (
          <Avatar
            key={size}
            name="Priya Sharma"
            size={size}
            status={{ label: "Online", tone: "success" }}
          />
        ))}
        <Avatar name="Rahul Verma" status={{ label: "Away" }} />
        <Avatar name="Ananya Iyer" decorative status={{ label: "Busy", tone: "danger" }} />
      </>,
    );
    await expect
      .element(page.getByRole("img", { name: "Priya Sharma, Online" }).first())
      .toBeVisible();
    await expect.element(page.getByRole("img", { name: "Rahul Verma, Away" })).toBeVisible();
    expect(page.getByRole("img", { name: /Ananya/ }).elements()).toHaveLength(0);
    const dots = [...container.querySelectorAll<HTMLElement>("[data-slot=avatar-status]")];
    expect(dots.map((dot) => dot.getAttribute("aria-hidden"))).toEqual(Array(6).fill("true"));
    // 8, 10, 12 and 14px, flush with the avatar's bottom and end edges: a circle's centre on its edge.
    const sizes = dots.slice(0, 4).map((dot) => {
      const [box, avatar] = [
        dot.getBoundingClientRect(),
        (dot.parentElement as HTMLElement).getBoundingClientRect(),
      ];
      expect(box.right).toBe(avatar.right);
      expect(box.bottom).toBe(avatar.bottom);
      return box.width;
    });
    expect(sizes).toEqual([8, 10, 12, 14]);
    expect(getComputedStyle(dots[0] as HTMLElement).backgroundColor).toBe(
      tokenColor("--qx-color-icon-success"),
    );
    expect(getComputedStyle(dots[4] as HTMLElement).backgroundColor).toBe(
      tokenColor("--qx-color-icon-subtle"),
    );
    // Round, as presence dots are (§3): the radius.full of a circle avatar.
    const circle = container.querySelector("[data-slot=avatar]") as HTMLElement;
    expect(getComputedStyle(dots[4] as HTMLElement).borderRadius).toBe(
      getComputedStyle(circle).borderRadius,
    );
  });

  it("status: the dot sits on the bottom-left in right to left (QTRX-181)", async () => {
    const { container } = await render(
      <div dir="rtl">
        <Avatar name="Priya Sharma" status={{ label: "Online", tone: "success" }} />
      </div>,
    );
    const dot = container.querySelector("[data-slot=avatar-status]") as HTMLElement;
    const avatar = container.querySelector("[data-slot=avatar]") as HTMLElement;
    expect(dot.getBoundingClientRect().left).toBe(avatar.getBoundingClientRect().left);
  });

  it("status: a 2px gap cuts the dot out of the avatar, so it reads on any surface (QTRX-181)", async () => {
    document.documentElement.dataset.qxColorScheme = "light";
    const { container } = await render(
      <div
        style={{
          zoom: 8,
          padding: 2,
          background: "var(--qx-color-bg-selected)",
          inlineSize: "fit-content",
        }}
      >
        <Avatar name="Priya Sharma" size="xl" status={{ label: "Online", tone: "success" }} />
      </div>,
    );
    const host = container.firstElementChild as HTMLElement;
    const shot = (await page.screenshot({ element: host, base64: true, save: false })) as unknown;
    const base64 = typeof shot === "string" ? shot : (shot as { base64: string }).base64;
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    [canvas.width, canvas.height] = [image.width, image.height];
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    context.drawImage(image, 0, 0);
    // Midway through the 2px gap (the dot's radius is 7, the gap's outer edge 9), on the diagonal
    // from the dot's centre (41, 41 in the 48px avatar) towards the avatar's: the row's tint.
    const scale = image.width / host.getBoundingClientRect().width;
    const at = (x: number, y: number) => [
      ...context.getImageData(Math.round(x * 8 * scale), Math.round(y * 8 * scale), 1, 1).data,
    ];
    const inGap = 2 + 41 - 8 / Math.SQRT2;
    const gap = at(inGap, inGap);
    const row = at(0.5, 0.5);
    expect(gap.slice(0, 3)).toEqual(row.slice(0, 3));
    delete document.documentElement.dataset.qxColorScheme;
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

  it("is accessible and looks right with a status, in either shape and both schemes", async () => {
    const tones = ["success", "warning", "danger", "neutral"] as const;
    const { container } = await render(
      <Stage>
        <div style={{ display: "grid", gap: 12 }}>
          {SHAPES.map((shape) => (
            <Inline key={shape} gap="sm">
              {SIZES.map((size, index) => (
                <Avatar
                  key={size}
                  name={shape === "circle" ? "Priya Sharma" : "Acme Pvt Ltd"}
                  size={size}
                  shape={shape}
                  status={{ label: tones[index] ?? "neutral", tone: tones[index] ?? "neutral" }}
                />
              ))}
              <Avatar
                name="Qeet Pay"
                src={LOGO}
                size="xl"
                shape={shape}
                status={{ label: "Live", tone: "success" }}
              />
            </Inline>
          ))}
        </div>
      </Stage>,
    );
    await expect.poll(() => container.querySelectorAll("img").length).toBe(2);
    await expectAccessible(container);
    await screenshotSchemes("Avatar · status");
  });
});
