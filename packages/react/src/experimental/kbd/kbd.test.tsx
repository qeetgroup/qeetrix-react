import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { Kbd } from "./kbd";

const apple = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
// What shows and what's said: the face the stylesheet shows, where a key has one per platform.
const shown = (root: Element) =>
  [...root.querySelectorAll<HTMLElement>("[data-slot=kbd-key] [aria-hidden]")]
    .filter((face) => face.checkVisibility())
    .map((face) => face.textContent);
const said = (root: Element) =>
  [...root.querySelectorAll<HTMLElement>(".qx-visually-hidden")]
    .filter((name) => name.checkVisibility())
    .map((name) => name.textContent?.trim())
    .join(" ");

describe("Kbd", () => {
  it("draws each key of a chord as its own <kbd>, Mod by platform", async () => {
    const { container } = await render(<Kbd keys="Mod+Shift+P" />);
    const outer = container.querySelector("kbd[data-slot=kbd]") as HTMLElement;
    expect(outer.querySelectorAll("kbd")).toHaveLength(3);
    expect(shown(outer)).toEqual(apple ? ["⌘", "⇧", "P"] : ["Ctrl", "Shift", "P"]);
  });

  it("centres each key's glyph on its ink, not on the em box, in either size", async () => {
    // From the font's own metrics, not the pixels: a glyph 12px high rasterises differently under
    // zoom, and only metrics say where its ink is at 1×.
    const { container } = await render(
      <>
        <Kbd keys="K" />
        <Kbd keys="K" size="sm" />
      </>,
    );
    const first = getComputedStyle(container.querySelector("[aria-hidden]") as Element);
    const font = `${first.fontWeight} ${first.fontSize} "Qeet Sans"`;
    await document.fonts.load(font, "K");
    expect(document.fonts.check(font, "K")).toBe(true);
    const context = document.createElement("canvas").getContext("2d") as CanvasRenderingContext2D;
    context.font = font;
    const metrics = context.measureText("K");
    for (const key of container.querySelectorAll<HTMLElement>("[data-slot=kbd-key]")) {
      const range = document.createRange();
      range.selectNodeContents(key.querySelector("[aria-hidden]") as Node);
      // The text's box runs from the font's ascent to its descent: the baseline is under the ascent.
      const baseline = range.getBoundingClientRect().top + metrics.fontBoundingBoxAscent;
      const ink =
        baseline - (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
      const cap = key.getBoundingClientRect();
      const offset = ink - (cap.top + cap.height / 2);
      expect(Math.abs(offset), `${key.parentElement?.dataset.size}`).toBeLessThanOrEqual(0.5);
    }
  });

  it("shows Apple's faces where <html data-qx-platform> says Apple, before React decides", async () => {
    document.documentElement.setAttribute("data-qx-platform", "apple");
    try {
      const { container } = await render(<Kbd keys="Mod+Alt+K" />);
      expect(shown(container)).toEqual(["⌘", "⌥", "K"]);
      expect(said(container)).toBe("Command Option K");
    } finally {
      document.documentElement.removeAttribute("data-qx-platform");
    }
  });

  it("says key names, not symbols", async () => {
    const { container } = await render(<Kbd keys="Mod+K" />);
    expect(said(container)).toBe(apple ? "Command K" : "Control K");
  });

  it("says 'then' between the steps of a sequence", async () => {
    const { container } = await render(<Kbd keys="G I" />);
    expect(shown(container)).toEqual(["G", "I"]);
    expect(said(container)).toBe("G then I");
  });

  it("speaks Hindi through QeetrixProvider", async () => {
    const { container } = await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <Kbd keys="Shift+Enter" />
      </QeetrixProvider>,
    );
    expect(said(container)).toBe("शिफ्ट एंटर");
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <Kbd keys="Mod+K" />
        <Kbd keys="Shift+Enter" />
        <Kbd keys="G I" />
        <Kbd keys="Esc" size="sm" />
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Kbd", "[data-qx-stage]");
  });
});
