import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { StateRuler, StateRulerItem } from "./state-ruler";

function ConnectionStates() {
  return (
    <StateRuler aria-label="Connection states">
      <StateRulerItem label="Draft" description="Saved; no one signs in through it yet." current />
      <StateRulerItem label="On" description="People sign in through it." />
      <StateRulerItem label="Off" description="No one signs in through it; accounts stay." />
    </StateRuler>
  );
}

describe("StateRuler", () => {
  it("lists the states side by side, the current one marked and ruled in Ember", async () => {
    await render(
      <div style={{ inlineSize: 720 }}>
        <ConnectionStates />
      </div>,
    );
    const list = page.getByRole("list", { name: "Connection states" });
    await expect.element(list).toBeVisible();
    const [draft, on] = page.getByRole("listitem").elements();
    expect(draft?.getAttribute("aria-current")).toBe("true");
    expect(on?.hasAttribute("aria-current")).toBe(false);
    expect(getComputedStyle(draft as Element).boxShadow).toContain(
      tokenColor("--qx-color-border-brand"),
    );
    expect(Math.round(draft?.getBoundingClientRect().top ?? 0)).toBe(
      Math.round(on?.getBoundingClientRect().top ?? -1),
    );
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <ConnectionStates />
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("StateRuler");
  });
});
