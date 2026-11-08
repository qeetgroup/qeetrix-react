import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
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
