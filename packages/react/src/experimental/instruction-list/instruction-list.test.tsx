import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { InstructionList, InstructionStep } from "./instruction-list";

function FixSteps(props: { orientation?: "vertical" | "horizontal" }) {
  return (
    <InstructionList {...props}>
      <InstructionStep title="Check the address." value="ldaps://ldap.acme.in:636">
        If the host or port is wrong, correct it on the connection.
      </InstructionStep>
      <InstructionStep title="Let Qeet ID reach it." note="Port 636 must be open.">
        Open your firewall to Qeet ID.
      </InstructionStep>
      <InstructionStep title="Check again.">
        A check that passes closes the failure.
      </InstructionStep>
    </InstructionList>
  );
}

describe("InstructionList", () => {
  it("is an ordered list of numbered steps, each a lead, a sentence, a value and a note", async () => {
    await render(<FixSteps />);
    const steps = page.getByRole("listitem").elements();
    expect(steps).toHaveLength(3);
    expect(page.getByRole("list").element().tagName).toBe("OL");
    expect(getComputedStyle(steps[0] as Element).listStyleType).toBe("none");
    expect(steps[0]?.textContent).toContain("Check the address. If the host");
    await expect.element(page.getByText("ldaps://ldap.acme.in:636")).toBeVisible();
  });

  it("lays a horizontal list out as one row of steps", async () => {
    await render(
      <div style={{ inlineSize: 900 }}>
        <FixSteps orientation="horizontal" />
      </div>,
    );
    const [a, b, c] = page
      .getByRole("listitem")
      .elements()
      .map((s) => s.getBoundingClientRect());
    expect(Math.round(a?.top ?? 0)).toBe(Math.round(c?.top ?? -1));
    expect(b?.left ?? 0).toBeGreaterThanOrEqual((a?.right ?? 0) - 0.5);
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <FixSteps />
        <FixSteps orientation="horizontal" />
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("InstructionList");
  });
});
