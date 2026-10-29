import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { Kbd } from "./kbd";

const apple = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const shown = (root: Element) =>
  [...root.querySelectorAll("[data-slot=kbd-key] > [aria-hidden]")].map((key) => key.textContent);
const said = (root: Element) =>
  [...root.querySelectorAll(".qx-visually-hidden")]
    .map((name) => name.textContent?.trim())
    .join(" ");

describe("Kbd", () => {
  it("draws each key of a chord as its own <kbd>, Mod by platform", async () => {
    const { container } = await render(<Kbd keys="Mod+Shift+P" />);
    const outer = container.querySelector("kbd[data-slot=kbd]") as HTMLElement;
    expect(outer.querySelectorAll("kbd")).toHaveLength(3);
    expect(shown(outer)).toEqual(apple ? ["⌘", "⇧", "P"] : ["Ctrl", "Shift", "P"]);
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
