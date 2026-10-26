import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { canEmulateMedia, emulateMedia, systemColor } from "../../../tests/support/media";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { settled } from "../../../tests/support/settled";
import { Stage } from "../../../tests/support/stage";
import { ProviderButton } from "./provider-button";
import { ProviderButtonGroup } from "./provider-button-group";

const html = document.documentElement;
afterEach(() => {
  delete html.dataset.qxDensity;
  delete html.dataset.qxColorScheme;
  html.removeAttribute("dir");
});

// Stand-in marks, not the providers' artwork: apps pass their own logos. Their colours are the
// point of a logo, so they're literal here (the library itself ships none).
const FourSquares = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <rect width="9" height="9" fill="#f25022" />
    <rect x="11" width="9" height="9" fill="#7fba00" />
    <rect y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);
const Ring = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="7" fill="none" stroke="#4285f4" strokeWidth="4" />
  </svg>
);
/** A monochrome mark drawn in white, which vanishes on a light surface. */
const WhiteMark = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="8" fill="#fff" />
  </svg>
);
/** A monochrome mark drawn in black, which vanishes on a dark surface. */
const BlackMark = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="8" fill="#000" />
  </svg>
);

function Providers({ onGoogle, disabled = false }: { onGoogle?: () => void; disabled?: boolean }) {
  return (
    <ProviderButtonGroup aria-label="Sign in with another account" style={{ inlineSize: 400 }}>
      <ProviderButton
        logo={<Ring />}
        aria-label="Sign in with Google"
        onClick={onGoogle}
        disabled={disabled}
      >
        Google
      </ProviderButton>
      <ProviderButton logo={<FourSquares />} aria-label="Sign in with Microsoft">
        Microsoft
      </ProviderButton>
      <ProviderButton logo={<WhiteMark />} logoInvert="light" aria-label="Sign in with Apple">
        Apple
      </ProviderButton>
    </ProviderButtonGroup>
  );
}

const slot = (name: string, within: ParentNode = document) =>
  within.querySelector(`[data-slot="${name}"]`) as HTMLElement;
const box = (element: Element) => element.getBoundingClientRect();

describe("ProviderButtonGroup", () => {
  it("is a fieldset named by its aria-label, without fieldset chrome", async () => {
    await render(<Providers />);
    const group = page.getByRole("group", { name: "Sign in with another account" });
    await expect.element(group).toBeVisible();
    const fieldset = group.element() as HTMLElement;
    expect(fieldset.tagName).toBe("FIELDSET");
    expect(fieldset.classList).toContain("qx-provider-button-group");
    const style = getComputedStyle(fieldset);
    expect(style.paddingTop).toBe("0px");
    expect(style.marginTop).toBe("0px");
    expect(style.borderTopWidth).toBe("1px");
    expect(style.borderTopColor).toBe(tokenColor("--qx-color-border-default"));
    expect(style.borderTopLeftRadius).toBe("4px");
    expect(style.backgroundColor).toBe(tokenColor("--qx-color-surface-raised"));
  });

  it("gives every provider an equal cell, with 1px rules between them", async () => {
    await render(<Providers />);
    const cells = [...document.querySelectorAll("[data-slot=provider-button]")] as HTMLElement[];
    expect(cells).toHaveLength(3);
    const widths = cells.map((cell) => box(cell).width);
    for (const width of widths) expect(Math.abs(width - (widths[0] as number))).toBeLessThan(1);
    // 400px less the group's two 1px borders, shared three ways.
    expect(Math.abs((widths[0] as number) - 398 / 3)).toBeLessThan(1);
    const rules = cells.map((cell) => getComputedStyle(cell).borderInlineStartWidth);
    expect(rules).toEqual(["0px", "1px", "1px"]);
  });

  it("is the field height at every density, its cells inside the border", async () => {
    await render(<Providers />);
    const group = slot("provider-button-group");
    const heights: Record<string, number> = {};
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      heights[density] = box(group).height;
      expect(box(slot("provider-button")).height).toBe(heights[density] - 2);
    }
    expect(heights).toEqual({ compact: 32, default: 40, comfortable: 44 });
  });

  it("puts the rules on the reading side, right to left", async () => {
    html.dir = "rtl";
    await render(<Providers />);
    const [first, second] = [...document.querySelectorAll("[data-slot=provider-button]")];
    expect(box(first as Element).left).toBeGreaterThan(box(second as Element).left);
    expect(getComputedStyle(second as Element).borderRightWidth).toBe("1px");
    // The logo leads in the reading direction.
    const logo = slot("provider-button-logo", first as Element);
    const label = slot("provider-button-label", first as Element);
    expect(box(logo).left).toBeGreaterThan(box(label).left);
  });
});

describe("ProviderButton", () => {
  it("is named by the whole phrase, shows the provider's name, and hides its logo", async () => {
    const onGoogle = vi.fn();
    await render(<Providers onGoogle={onGoogle} />);
    const google = page.getByRole("button", { name: "Sign in with Google" });
    await expect.element(google).toHaveTextContent("Google");
    await expect.element(google).toHaveAttribute("type", "button");
    const logo = slot("provider-button-logo", google.element());
    expect(logo.getAttribute("aria-hidden")).toBe("true");
    // The logo is drawn at 20px (size.icon.md), before the label.
    const mark = logo.querySelector("svg") as SVGElement;
    expect([box(mark).width, box(mark).height]).toEqual([20, 20]);
    const label = slot("provider-button-label", google.element());
    expect(box(mark).right).toBeLessThan(box(label).left);
    await google.click();
    expect(onGoogle).toHaveBeenCalledTimes(1);
  });

  it("takes keyboard focus, with the Ember frame inside its cell", async () => {
    await render(<Providers />);
    await userEvent.keyboard("{Tab}");
    const google = page.getByRole("button", { name: "Sign in with Google" });
    await expect.element(google).toHaveFocus();
    const style = getComputedStyle(google.element());
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("2px");
    expect(style.outlineOffset).toBe("-2px");
    expect(style.outlineColor).toBe(tokenColor("--qx-color-border-focus"));
    await userEvent.keyboard("{Tab}");
    await expect
      .element(page.getByRole("button", { name: "Sign in with Microsoft" }))
      .toHaveFocus();
  });

  it("tints neutral on hover", async () => {
    await render(<Providers />);
    const microsoft = page.getByRole("button", { name: "Sign in with Microsoft" });
    await microsoft.hover();
    await settled();
    expect(getComputedStyle(microsoft.element()).backgroundColor).toBe(
      tokenColor("--qx-color-bg-neutral-subtle-hover"),
    );
  });

  it("disabled: stays focusable, says so, and ignores clicks", async () => {
    const onGoogle = vi.fn();
    await render(<Providers onGoogle={onGoogle} disabled />);
    const google = page.getByRole("button", { name: "Sign in with Google" });
    await expect.element(google).toHaveAttribute("aria-disabled", "true");
    await expect.element(google).toHaveAttribute("data-disabled", "");
    await userEvent.keyboard("{Tab}");
    await expect.element(google).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    await google.click({ force: true });
    expect(onGoogle).not.toHaveBeenCalled();
    expect(getComputedStyle(google.element()).color).toBe(tokenColor("--qx-color-text-disabled"));
  });

  it("renders a link through `render`, which `disabled` stops", async () => {
    const ref = createRef<HTMLButtonElement>();
    const { rerender } = await render(
      <ProviderButtonGroup aria-label="Sign in with another account">
        <ProviderButton
          ref={ref}
          render={<a href="#oauth-google" data-router="" />}
          logo={<Ring />}
          aria-label="Sign in with Google"
        >
          Google
        </ProviderButton>
      </ProviderButtonGroup>,
    );
    const link = page.getByRole("link", { name: "Sign in with Google" });
    await expect.element(link).toHaveAttribute("href", "#oauth-google");
    await expect.element(link).toHaveAttribute("data-router", "");
    await expect.element(link).toHaveAttribute("data-slot", "provider-button");
    await expect.element(link).not.toHaveAttribute("type");
    expect(ref.current).toBe(link.element());
    await rerender(
      <ProviderButtonGroup aria-label="Sign in with another account">
        <ProviderButton
          render={<a href="#oauth-google" />}
          logo={<Ring />}
          aria-label="Sign in with Google"
          disabled
        >
          Google
        </ProviderButton>
      </ProviderButtonGroup>,
    );
    await link.click({ force: true });
    expect(window.location.hash).not.toBe("#oauth-google");
    await expect.element(link).toHaveAttribute("aria-disabled", "true");
  });

  it("inverts a monochrome logo in the scheme where it would vanish, following the nearest scheme", async () => {
    await render(
      <ProviderButtonGroup aria-label="Sign in with another account">
        <ProviderButton logo={<WhiteMark />} logoInvert="light" aria-label="Sign in with Apple">
          Apple
        </ProviderButton>
        <ProviderButton logo={<BlackMark />} logoInvert="dark" aria-label="Sign in with GitHub">
          GitHub
        </ProviderButton>
        <ProviderButton
          logo={
            <span data-invert="dark">
              <BlackMark />
            </span>
          }
          aria-label="Sign in with GitLab"
        >
          GitLab
        </ProviderButton>
      </ProviderButtonGroup>,
    );
    const filter = (name: string) => {
      const button = page.getByRole("button", { name }).element();
      return getComputedStyle(button.querySelector("[data-invert]") as Element).filter;
    };
    expect(filter("Sign in with Apple")).toBe("invert(1)");
    expect(filter("Sign in with GitHub")).toBe("none");
    expect(filter("Sign in with GitLab")).toBe("none");
    html.dataset.qxColorScheme = "dark";
    expect(filter("Sign in with Apple")).toBe("none");
    expect(filter("Sign in with GitHub")).toBe("invert(1)");
    expect(filter("Sign in with GitLab")).toBe("invert(1)");
    // A section shown in light inside a dark page: the nearest scheme wins.
    const group = slot("provider-button-group");
    group.dataset.qxColorScheme = "light";
    expect(filter("Sign in with Apple")).toBe("invert(1)");
    expect(filter("Sign in with GitHub")).toBe("none");
  });

  it("keeps a long label in its cell, cut short with an ellipsis", async () => {
    await render(
      <ProviderButtonGroup aria-label="Sign in with another account" style={{ inlineSize: 240 }}>
        <ProviderButton logo={<Ring />} aria-label="Sign in with Google">
          Google
        </ProviderButton>
        <ProviderButton logo={<FourSquares />} aria-label="Sign in with Microsoft Entra ID">
          Microsoft Entra ID
        </ProviderButton>
      </ProviderButtonGroup>,
    );
    const cell = page.getByRole("button", { name: "Sign in with Microsoft Entra ID" }).element();
    const label = slot("provider-button-label", cell);
    expect(getComputedStyle(label).textOverflow).toBe("ellipsis");
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    expect(box(label).right).toBeLessThanOrEqual(box(cell).right);
    expect(box(slot("provider-button-group")).width).toBe(240);
  });

  it.runIf(canEmulateMedia)("keeps its edges, rules and states in forced colours", async () => {
    await render(<Providers disabled />);
    const reset = await emulateMedia({ "forced-colors": "active" });
    try {
      await settled();
      const group = getComputedStyle(slot("provider-button-group"));
      expect(group.borderTopStyle).toBe("solid");
      expect(group.borderTopWidth).toBe("1px");
      const cells = [...document.querySelectorAll("[data-slot=provider-button]")];
      expect(getComputedStyle(cells[1] as Element).borderInlineStartStyle).toBe("solid");
      expect(getComputedStyle(cells[0] as Element).color).toBe(systemColor("GrayText"));
      await userEvent.keyboard("{Tab}");
      expect(getComputedStyle(cells[0] as Element).outlineStyle).toBe("solid");
    } finally {
      await reset();
    }
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <div style={{ display: "grid", gap: 16 }}>
          <Providers />
          <ProviderButtonGroup
            aria-label="Sign up with another account"
            style={{ inlineSize: 400 }}
          >
            <ProviderButton logo={<Ring />} aria-label="Sign up with Google">
              Google
            </ProviderButton>
            <ProviderButton logo={<BlackMark />} logoInvert="dark" aria-label="Sign up with GitHub">
              GitHub
            </ProviderButton>
            <ProviderButton logo={<FourSquares />} aria-label="Sign up with Microsoft" disabled>
              Microsoft
            </ProviderButton>
          </ProviderButtonGroup>
        </div>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("ProviderButton");
  });
});
