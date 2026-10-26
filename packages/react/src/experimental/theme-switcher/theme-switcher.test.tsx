import { MonitorIcon } from "@qeetrix/icons/icons/monitor";
import { MoonIcon } from "@qeetrix/icons/icons/moon";
import { SunIcon } from "@qeetrix/icons/icons/sun";
import { type ComponentType, createRef, useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { Inline } from "../../inline/inline";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { ThemeSwitcher } from "./theme-switcher";

const html = document.documentElement;
afterEach(() => {
  vi.restoreAllMocks();
  delete html.dataset.qxDensity;
});

const tooltip = () => document.querySelector("[data-slot=tooltip-popup]");
const box = (element: Element) => element.getBoundingClientRect();

/** An icon's drawing (its paths), to tell which icon a control shows. */
const drawing = (Icon: ComponentType<{ shape: "sharp"; variant?: "filled"; size: number }>) => {
  const holder = document.createElement("div");
  holder.innerHTML = renderToStaticMarkup(<Icon shape="sharp" size={16} />);
  return holder.querySelector("svg")?.innerHTML;
};
const shown = (control: Element) => control.querySelector("svg")?.innerHTML;

const trigger = () => page.getByRole("button", { name: "Theme" });
const option = (name: string) => page.getByRole("menuitemradio", { name });

describe("ThemeSwitcher: menu (default)", () => {
  it("follows QeetrixProvider: its icon shows the choice, and choosing changes the scheme", async () => {
    const onColorSchemeChange = vi.fn();
    const onValueChange = vi.fn();
    await render(
      <QeetrixProvider defaultColorScheme="light" onColorSchemeChange={onColorSchemeChange}>
        <ThemeSwitcher onValueChange={onValueChange} />
      </QeetrixProvider>,
    );
    await expect.poll(() => html.dataset.qxColorScheme).toBe("light");
    await expect.element(trigger()).toHaveAttribute("aria-haspopup", "menu");
    expect(shown(trigger().element())).toBe(drawing(SunIcon));

    await trigger().click();
    await expect.element(page.getByRole("menu")).toBeVisible();
    await expect.element(option("Light")).toHaveAttribute("aria-checked", "true");
    await expect.element(option("Dark")).toHaveAttribute("aria-checked", "false");
    await expect.element(option("System")).toHaveAttribute("aria-checked", "false");

    await option("Dark").click();
    await expect.poll(() => html.dataset.qxColorScheme).toBe("dark");
    expect(onColorSchemeChange).toHaveBeenLastCalledWith("dark");
    expect(onValueChange).toHaveBeenLastCalledWith("dark");
    // Choosing closes the menu, and the trigger shows the new choice.
    await expect.poll(() => document.querySelector("[role=menu]")).toBeNull();
    expect(shown(trigger().element())).toBe(drawing(MoonIcon));

    await trigger().click();
    await option("System").click();
    await expect.poll(() => shown(trigger().element())).toBe(drawing(MonitorIcon));
    expect(onValueChange).toHaveBeenLastCalledWith("system");
  });

  it("marks the current choice with a check at the end, never a radio dot", async () => {
    await render(
      <QeetrixProvider defaultColorScheme="dark">
        <ThemeSwitcher />
      </QeetrixProvider>,
    );
    await trigger().click();
    const dark = option("Dark").element();
    const light = option("Light").element();
    expect(document.querySelector(".qx-menu-dot")).toBeNull();
    // Each option: its sharp icon first, then the label, then the check's column.
    const parts = [...dark.children].map((child) => child.getAttribute("data-slot"));
    expect(parts).toEqual(["menu-item-icon", "menu-item-label", "menu-item-mark"]);
    expect(dark.querySelector("[data-slot=menu-item-icon]")?.innerHTML).toBe(drawing(MoonIcon));
    const check = dark.querySelector("[data-slot=menu-item-mark] svg") as SVGElement;
    expect(check).not.toBeNull();
    const label = dark.querySelector("[data-slot=menu-item-label]") as HTMLElement;
    expect(box(check).left).toBeGreaterThan(box(label).right);
    // Only the current one is checked; the others keep the column, so labels line up.
    expect(light.querySelector("[data-slot=menu-item-mark] svg")).toBeNull();
    expect(box(light.querySelector("[data-slot=menu-item-mark]") as Element).width).toBe(16);
  });

  it("is compact: the popup fits its three choices, not a menu's 200px", async () => {
    await render(
      <QeetrixProvider defaultColorScheme="light">
        <ThemeSwitcher />
      </QeetrixProvider>,
    );
    await trigger().click();
    const popup = page.getByRole("menu").element();
    expect(popup.classList).toContain("qx-theme-switcher-menu");
    // 10rem: the minimum, which the three short choices don't exceed.
    expect(box(popup).width).toBe(160);
  });

  it("choosing the current scheme again keeps it, and reports nothing", async () => {
    const onValueChange = vi.fn();
    await render(
      <QeetrixProvider defaultColorScheme="dark">
        <ThemeSwitcher onValueChange={onValueChange} />
      </QeetrixProvider>,
    );
    await trigger().click();
    await option("Dark").click();
    await trigger().click();
    await expect.element(option("Dark")).toHaveAttribute("aria-checked", "true");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(html.dataset.qxColorScheme).toBe("dark");
  });

  it("works from the keyboard, and gives focus back to its trigger", async () => {
    await render(
      <QeetrixProvider defaultColorScheme="system">
        <ThemeSwitcher />
      </QeetrixProvider>,
    );
    await userEvent.keyboard("{Tab}");
    await expect.element(trigger()).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect.element(page.getByRole("menu")).toBeVisible();
    await expect.element(option("Light")).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(option("Dark")).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect.poll(() => html.dataset.qxColorScheme).toBe("dark");
    await expect.poll(() => document.querySelector("[role=menu]")).toBeNull();
    await expect.element(trigger()).toHaveFocus();
  });

  it("shows its name as a tooltip", async () => {
    await render(
      <QeetrixProvider defaultColorScheme="light">
        <ThemeSwitcher />
      </QeetrixProvider>,
    );
    await userEvent.keyboard("{Tab}");
    await expect.poll(() => tooltip()?.textContent).toBe("Theme");
  });

  it("a disabled switcher stays focusable and doesn't open", async () => {
    await render(
      <QeetrixProvider defaultColorScheme="light">
        <ThemeSwitcher disabled />
      </QeetrixProvider>,
    );
    await userEvent.keyboard("{Tab}");
    await expect.element(trigger()).toHaveFocus();
    await expect.element(trigger()).toHaveAttribute("aria-disabled", "true");
    await userEvent.keyboard("{Enter}");
    await trigger().click({ force: true });
    expect(document.querySelector("[role=menu]")).toBeNull();
  });

  it("passes its ref and props to the trigger, and follows `size`", async () => {
    const ref = createRef<HTMLButtonElement>();
    await render(
      <QeetrixProvider defaultColorScheme="light">
        <Inline gap="md">
          <ThemeSwitcher ref={ref} id="scheme" size="sm" />
          <ThemeSwitcher size="lg" aria-label="Appearance" />
        </Inline>
      </QeetrixProvider>,
    );
    expect(ref.current).toBe(trigger().element());
    expect(ref.current?.id).toBe("scheme");
    expect(ref.current?.classList).toContain("qx-theme-switcher");
    expect(box(ref.current as Element).height).toBe(28);
    const large = page.getByRole("button", { name: "Appearance" }).element();
    expect(box(large).height).toBe(40);
  });
});

describe("ThemeSwitcher: segmented", () => {
  const toggle = (name: string) => page.getByRole("button", { name });

  it("is a group of three named, icon-only toggles; one is always pressed", async () => {
    const onValueChange = vi.fn();
    const { container } = await render(
      <QeetrixProvider defaultColorScheme="light">
        <ThemeSwitcher variant="segmented" onValueChange={onValueChange} />
      </QeetrixProvider>,
    );
    const group = page.getByRole("group", { name: "Theme" });
    await expect.element(group).toBeVisible();
    expect(container.querySelector("[data-slot=toggle-group]")?.classList).toContain(
      "qx-theme-switcher",
    );
    await expect.element(toggle("Light")).toHaveAttribute("aria-pressed", "true");
    await expect.element(toggle("Dark")).toHaveAttribute("aria-pressed", "false");
    await expect.element(toggle("System")).toHaveAttribute("aria-pressed", "false");

    await toggle("Dark").click();
    await expect.poll(() => html.dataset.qxColorScheme).toBe("dark");
    await expect.element(toggle("Dark")).toHaveAttribute("aria-pressed", "true");
    await expect.element(toggle("Light")).toHaveAttribute("aria-pressed", "false");
    expect(onValueChange).toHaveBeenLastCalledWith("dark");

    // Pressing the current choice again leaves it pressed: never nothing chosen.
    await toggle("Dark").click();
    await expect.element(toggle("Dark")).toHaveAttribute("aria-pressed", "true");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(html.dataset.qxColorScheme).toBe("dark");
  });

  it("draws sharp icons, the pressed one filled, and names each in a tooltip", async () => {
    await render(
      <QeetrixProvider defaultColorScheme="system">
        <ThemeSwitcher variant="segmented" />
      </QeetrixProvider>,
    );
    const system = toggle("System").element();
    const filled = system.querySelector("[data-slot=toggle-icon-filled]") as SVGElement;
    expect(getComputedStyle(filled).display).toBe("block");
    const sun = toggle("Light").element().querySelector("[data-slot=toggle-icon]") as SVGElement;
    expect(sun.innerHTML).toBe(drawing(SunIcon));
    // The group is one tab stop, and the arrow keys move between its toggles.
    await userEvent.keyboard("{Tab}");
    await expect.element(toggle("Light")).toHaveFocus();
    await expect.poll(() => tooltip()?.textContent).toBe("Light");
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(toggle("Dark")).toHaveFocus();
    await expect.poll(() => tooltip()?.textContent).toBe("Dark");
    await userEvent.keyboard(" ");
    await expect.poll(() => html.dataset.qxColorScheme).toBe("dark");
    await userEvent.keyboard("{Tab}");
    await expect.element(toggle("Dark")).not.toHaveFocus();
  });

  it("passes its ref and props to the group, follows `size`, and can be disabled", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <QeetrixProvider defaultColorScheme="light">
        <Inline gap="md">
          <ThemeSwitcher variant="segmented" ref={ref} id="scheme" size="sm" />
          <ThemeSwitcher variant="segmented" size="lg" aria-label="Appearance" disabled />
        </Inline>
      </QeetrixProvider>,
    );
    expect(ref.current?.id).toBe("scheme");
    expect(box(ref.current as Element).height).toBe(28);
    const large = page.getByRole("group", { name: "Appearance" }).element();
    expect(box(large).height).toBe(40);
    for (const button of large.querySelectorAll("button")) {
      expect(button.hasAttribute("disabled") || button.getAttribute("aria-disabled")).toBeTruthy();
    }
  });
});

/** A switcher whose scheme lives in its parent, as a product that stores it does. */
function Controlled({ onValueChange }: { onValueChange: (value: string) => void }) {
  const [scheme, setScheme] = useState<"light" | "dark" | "system">("dark");
  return (
    <>
      <ThemeSwitcher
        variant="segmented"
        value={scheme}
        onValueChange={(next) => {
          onValueChange(next);
          setScheme(next);
        }}
      />
      <output>{scheme}</output>
    </>
  );
}

describe("ThemeSwitcher: state", () => {
  it("controlled: shows `value`, reports the choice, and leaves the provider alone", async () => {
    const onValueChange = vi.fn();
    await render(
      <QeetrixProvider defaultColorScheme="light">
        <Controlled onValueChange={onValueChange} />
      </QeetrixProvider>,
    );
    await expect
      .element(page.getByRole("button", { name: "Dark" }))
      .toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "System" }).click();
    expect(onValueChange).toHaveBeenLastCalledWith("system");
    await expect.element(page.getByRole("status")).toHaveTextContent("system");
    await expect
      .element(page.getByRole("button", { name: "System" }))
      .toHaveAttribute("aria-pressed", "true");
    expect(html.dataset.qxColorScheme).toBe("light");
  });

  it("controlled without updates: stays on `value`", async () => {
    await render(<ThemeSwitcher value="dark" onValueChange={() => {}} />);
    await trigger().click();
    await option("Light").click();
    await trigger().click();
    await expect.element(option("Dark")).toHaveAttribute("aria-checked", "true");
  });

  it("uncontrolled with `defaultValue`: keeps its own choice, without a provider", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onValueChange = vi.fn();
    await render(<ThemeSwitcher defaultValue="system" onValueChange={onValueChange} />);
    expect(shown(trigger().element())).toBe(drawing(MonitorIcon));
    await trigger().click();
    await option("Light").click();
    expect(onValueChange).toHaveBeenLastCalledWith("light");
    await expect.poll(() => shown(trigger().element())).toBe(drawing(SunIcon));
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns in development when nothing manages the scheme", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await render(<ThemeSwitcher />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("QeetrixProvider"));
  });

  it("speaks Hindi through QeetrixProvider, and takes its own `messages`", async () => {
    await render(
      <QeetrixProvider defaultColorScheme="light" locale="hi-IN" messages={hi}>
        <Inline gap="md">
          <ThemeSwitcher />
          <ThemeSwitcher variant="segmented" messages={{ label: "रूप" }} />
        </Inline>
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("group", { name: "रूप" })).toBeVisible();
    await expect.element(page.getByRole("button", { name: "डार्क" })).toBeVisible();
    await page.getByRole("button", { name: "थीम" }).click();
    await expect.element(page.getByRole("menuitemradio", { name: "सिस्टम" })).toBeVisible();
  });

  it("hydrates server HTML without a mismatch, in both variants", async () => {
    const tree = (
      <QeetrixProvider defaultColorScheme="dark">
        <ThemeSwitcher />
        <ThemeSwitcher variant="segmented" />
      </QeetrixProvider>
    );
    const host = document.createElement("div");
    host.innerHTML = renderToString(tree);
    document.body.append(host);
    expect(host.querySelector("[aria-pressed=true]")?.getAttribute("aria-label")).toBe("Dark");
    const recoverable = vi.fn();
    const error = vi.spyOn(console, "error");
    const root = hydrateRoot(host, tree, { onRecoverableError: recoverable });
    // The provider's effect runs once hydration has finished.
    await expect.poll(() => html.dataset.qxColorScheme).toBe("dark");
    expect(recoverable).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(shown(host.querySelector("button") as Element)).toBe(drawing(MoonIcon));
    root.unmount();
    host.remove();
  });
});

describe("ThemeSwitcher: accessibility and look", () => {
  it("is accessible and looks right in both schemes: segmented, and the menu's trigger", async () => {
    const { container } = await render(
      <QeetrixProvider defaultColorScheme="light">
        <Stage>
          <ThemeSwitcher />
          <ThemeSwitcher variant="segmented" />
          <ThemeSwitcher variant="segmented" size="sm" />
        </Stage>
      </QeetrixProvider>,
    );
    await expectAccessible(container);
    await screenshotSchemes("ThemeSwitcher");
  });

  it("its open menu is accessible and looks right in both schemes", async () => {
    await page.viewport(320, 240);
    await render(
      <QeetrixProvider defaultColorScheme="dark">
        <div style={{ display: "flex", justifyContent: "flex-end", padding: 16 }}>
          <ThemeSwitcher />
        </div>
      </QeetrixProvider>,
    );
    await trigger().click();
    await expect.element(page.getByRole("menu")).toBeVisible();
    await expectAccessible(document.body);
    await screenshotSchemes("ThemeSwitcher · menu", null);
  });
});
