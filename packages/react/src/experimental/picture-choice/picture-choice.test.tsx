import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { contrast, tokenColor } from "../../../tests/support/color";
import { tab } from "../../../tests/support/keyboard";
import { canEmulateMedia, emulateMedia, systemColor } from "../../../tests/support/media";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { PictureChoice, PictureChoiceGroup } from "./picture-choice";

// Synthetic avatars: a letter on a tint, as data URLs, so nothing is fetched.
const avatar = (letter: string, fill: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${fill}"/><text x="32" y="42" font-size="28" text-anchor="middle" fill="#fff" font-family="sans-serif">${letter}</text></svg>`,
  )}`;
const animals = [
  ["fox", "Fox", "#c2410c"],
  ["owl", "Owl", "#4d7c0f"],
  ["cat", "Cat", "#1d4ed8"],
  ["elephant", "Elephant", "#6d28d9"],
  ["koi", "Koi", "#be123c"],
] as const;

function Avatars(props: { onValueChange?: (value: string) => void; columns?: number }) {
  return (
    <PictureChoiceGroup
      aria-label="Avatar"
      defaultValue="fox"
      {...(props.columns !== undefined ? { columns: props.columns } : {})}
      {...(props.onValueChange ? { onValueChange: props.onValueChange } : {})}
    >
      {animals.map(([value, label, fill]) => (
        <PictureChoice
          key={value}
          value={value}
          label={label}
          src={avatar(label[0] as string, fill)}
        />
      ))}
      <PictureChoice value="none" label="No avatar" disabled />
    </PictureChoiceGroup>
  );
}

function Backgrounds() {
  return (
    <PictureChoiceGroup aria-label="Background" shape="square" size="lg" defaultValue="teal">
      <PictureChoice value="white" label="White" color="#ffffff" />
      <PictureChoice value="teal" label="Teal" color="#0f766e" />
      <PictureChoice value="sand" label="Sand" color="#e7d8b9" />
      <PictureChoice value="brand" label="Ember" color="var(--qx-color-bg-brand-bold)" />
    </PictureChoiceGroup>
  );
}

const option = (name: string) =>
  page.getByRole("radio", { name, exact: true }).element() as HTMLElement;
const tick = (name: string) => option(name).querySelector("[data-slot=picture-choice-tick]");

describe("PictureChoice", () => {
  it("is a radio group whose pictures are named by their labels", async () => {
    await render(<Avatars />);
    expect(page.getByRole("radiogroup", { name: "Avatar" }).element()).toBeTruthy();
    for (const [, label] of animals) expect(option(label).getAttribute("aria-label")).toBe(label);
    // The picture is decoration: the radio's name is its label.
    expect(option("Fox").querySelector("img")?.getAttribute("alt")).toBe("");
    expect(option("Fox").getAttribute("aria-checked")).toBe("true");
    expect(option("Owl").getAttribute("aria-checked")).toBe("false");
  });

  it("chooses with a click, and with the arrow keys from one tab stop; a disabled option is skipped", async () => {
    const onValueChange = vi.fn();
    await render(<Avatars onValueChange={onValueChange} />);
    await userEvent.click(option("Cat"));
    expect(onValueChange).toHaveBeenLastCalledWith("cat", expect.anything());
    expect(option("Cat").getAttribute("aria-checked")).toBe("true");
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(option("Elephant"));
    expect(onValueChange).toHaveBeenLastCalledWith("elephant", expect.anything());
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    // Koi, then past the disabled "No avatar" back to the first.
    expect(document.activeElement).toBe(option("Fox"));
    expect(option("No avatar").hasAttribute("data-disabled")).toBe(true);
  });

  it("rings the chosen picture in Ember, set off by the surface, and ticks it", async () => {
    await render(<Avatars />);
    const chosen = getComputedStyle(option("Fox")).boxShadow;
    expect(chosen).toContain(tokenColor("--qx-color-border-brand"));
    expect(chosen).toContain(tokenColor("--qx-color-surface-default"));
    expect(getComputedStyle(option("Owl")).boxShadow).not.toContain(
      tokenColor("--qx-color-border-brand"),
    );
    // The tick shows on the chosen picture only: the choice isn't told by colour alone.
    expect(tick("Fox")).toBeTruthy();
    expect(tick("Owl")).toBeNull();
    const badge = getComputedStyle(tick("Fox") as Element);
    expect(badge.backgroundColor).toBe(tokenColor("--qx-color-bg-brand-bold"));
    expect(badge.color).toBe(tokenColor("--qx-color-text-on-brand"));
  });

  it("lays pictures out in a grid of columns, or a row that wraps", async () => {
    const lefts = () =>
      new Set(
        [...document.querySelectorAll(".qx-picture-choice")].map((each) =>
          Math.round(each.getBoundingClientRect().left),
        ),
      );
    const tops = () =>
      new Set(
        [...document.querySelectorAll(".qx-picture-choice")].map((each) =>
          Math.round(each.getBoundingClientRect().top),
        ),
      );
    const grid = await render(<Avatars columns={3} />);
    expect(lefts().size).toBe(3);
    expect(tops().size).toBe(2);
    await grid.unmount();
    await render(
      <div style={{ inlineSize: 200 }}>
        <Avatars />
      </div>,
    );
    // 48px pictures 12px apart: three a row in 200px.
    expect(lefts().size).toBe(3);
    expect(tops().size).toBe(2);
  });

  it("is round for people and square for anything else, 48px or 64px", async () => {
    await render(
      <>
        <Avatars />
        <Backgrounds />
      </>,
    );
    const fox = option("Fox").getBoundingClientRect();
    expect([fox.width, fox.height]).toEqual([48, 48]);
    expect(getComputedStyle(option("Fox")).borderRadius).toBe("9999px");
    const teal = option("Teal");
    expect(teal.getBoundingClientRect().width).toBe(64);
    expect(getComputedStyle(teal).borderRadius).toBe(
      getComputedStyle(document.documentElement).getPropertyValue("--qx-radius-control").trim(),
    );
    // A swatch is its colour; a token's variable works as well as a hex colour.
    expect(getComputedStyle(teal).backgroundColor).toBe("rgb(15, 118, 110)");
    expect(getComputedStyle(option("Ember")).backgroundColor).toBe(
      tokenColor("--qx-color-bg-brand-bold"),
    );
  });

  it.runIf(canEmulateMedia)("keeps the ring and the tick in forced colours", async () => {
    await render(<Avatars />);
    const reset = await emulateMedia({ "forced-colors": "active" });
    try {
      const fox = getComputedStyle(option("Fox"));
      expect(fox.outlineColor).toBe(systemColor("Highlight"));
      expect(fox.outlineStyle).toBe("solid");
      expect(getComputedStyle(tick("Fox") as Element).backgroundColor).toBe(
        systemColor("Highlight"),
      );
    } finally {
      await reset();
    }
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <Avatars columns={3} />
        <Backgrounds />
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("PictureChoice", "[data-qx-stage]");
  });
});

/** Background tones as Qeet Circle draws them: small square swatches in a row. */
const TONES = [
  ["white", "White", "#ffffff"],
  ["teal", "Teal", "#0f766e"],
  ["sand", "Sand", "#e7d8b9"],
  ["plum", "Plum", "#6b2150"],
  ["ink", "Ink", "#1f2937"],
] as const;

function Tones({ shape = "square" }: { shape?: "round" | "square" }) {
  return (
    <PictureChoiceGroup aria-label="Background tone" shape={shape} size="sm" defaultValue="teal">
      {TONES.map(([value, label, color]) => (
        <PictureChoice key={value} value={value} label={label} color={color} />
      ))}
    </PictureChoiceGroup>
  );
}

describe("PictureChoice, small", () => {
  const box = (element: Element) => element.getBoundingClientRect();

  it("is 36px, round or square, a target well over 24px, the tick scaled to fit", async () => {
    const square = await render(<Tones />);
    const teal = option("Teal");
    expect([box(teal).width, box(teal).height]).toEqual([36, 36]);
    expect(getComputedStyle(teal).borderRadius).toBe(
      getComputedStyle(document.documentElement).getPropertyValue("--qx-radius-control").trim(),
    );
    // The tick: a 16px disc on the top-end corner, its check 10px, inside the ring's reach.
    const mark = tick("Teal") as HTMLElement;
    expect([box(mark).width, box(mark).height]).toEqual([16, 16]);
    expect(box(mark).right - box(teal).right).toBe(3);
    expect(box(teal).top - box(mark).top).toBe(3);
    const check = mark.querySelector("svg") as SVGElement;
    expect([box(check).width, box(check).height]).toEqual([10, 10]);
    expect(tick("Sand")).toBeNull();
    // The ring is the 2px Ember ring every size has, set off by the surface.
    const ring = getComputedStyle(teal).boxShadow;
    expect(ring).toContain(tokenColor("--qx-color-border-brand"));
    expect(ring).toContain("0px 0px 0px 4px");
    await square.unmount();
    await render(<Tones shape="round" />);
    expect(box(option("Teal")).width).toBe(36);
    expect(getComputedStyle(option("Teal")).borderRadius).toBe("9999px");
  });

  it("leaves md and lg as they are, md the default", async () => {
    await render(
      <>
        <Avatars />
        <Backgrounds />
      </>,
    );
    expect(box(option("Fox")).width).toBe(48);
    expect(box(option("Teal")).width).toBe(64);
    expect(box(tick("Fox") as Element).width).toBe(20);
    expect(box(tick("Teal") as Element).width).toBe(20);
  });

  it("is one tab stop, the arrow keys moving and choosing, with the focus frame outside the ring", async () => {
    const onValueChange = vi.fn();
    await render(
      <PictureChoiceGroup
        aria-label="Background tone"
        shape="square"
        size="sm"
        defaultValue="teal"
        onValueChange={onValueChange}
      >
        {TONES.map(([value, label, color]) => (
          <PictureChoice key={value} value={value} label={label} color={color} />
        ))}
      </PictureChoiceGroup>,
    );
    await tab();
    expect(document.activeElement).toBe(option("Teal"));
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(option("Sand"));
    expect(onValueChange).toHaveBeenLastCalledWith("sand", expect.anything());
    expect(tick("Sand")).toBeTruthy();
    const sand = getComputedStyle(option("Sand"));
    expect(sand.outlineColor).toBe(tokenColor("--qx-color-border-focus"));
    expect(sand.outlineWidth).toBe("2px");
    // Outside the 4px of the ring and its gap, and clear of the next swatch's ring: 12px apart.
    expect(sand.outlineOffset).toBe("6px");
    const frameEnd = box(option("Sand")).right + 6 + 2;
    const nextRingStart = box(option("Plum")).left - 4;
    expect(frameEnd).toBeLessThanOrEqual(nextRingStart + 0.5);
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(document.activeElement).toBe(option("White"));
    expect(option("White").getAttribute("aria-checked")).toBe("true");
  });

  it("keeps the ring, the tick and the focus frame at 3:1 or more on every surface, light and dark", () => {
    const html = document.documentElement;
    const below: string[] = [];
    const pairs = [
      ["ring", "--qx-color-border-brand"],
      ["tick", "--qx-color-bg-brand-bold"],
      ["focus frame", "--qx-color-border-focus"],
    ] as const;
    for (const scheme of ["light", "dark"]) {
      html.dataset.qxColorScheme = scheme;
      for (const surface of ["default", "raised", "canvas", "overlay"]) {
        const ground = tokenColor(`--qx-color-surface-${surface}`);
        for (const [part, token] of pairs) {
          const ratio = contrast(tokenColor(token), ground);
          if (ratio < 3) below.push(`${scheme} ${part} on ${surface}: ${ratio.toFixed(2)}`);
        }
      }
      // The check on its disc.
      const check = contrast(
        tokenColor("--qx-color-text-on-brand"),
        tokenColor("--qx-color-bg-brand-bold"),
      );
      if (check < 3) below.push(`${scheme} check on its disc: ${check.toFixed(2)}`);
    }
    delete html.dataset.qxColorScheme;
    expect(below).toEqual([]);
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <Tones />
        <Tones shape="round" />
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("PictureChoice · small", "[data-qx-stage]");
  });
});
