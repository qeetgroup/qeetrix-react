import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { CheckItem, CheckList } from "./check-list";

function SamlChecks() {
  return (
    <CheckList footer="Checked 2 minutes ago">
      <CheckItem
        title="The provider's entity ID is set"
        detail="https://accounts.google.com"
        status="passed"
      />
      <CheckItem title="The certificate is in date" detail="Until 23 Aug 2030" status="failed" />
      <CheckItem title="The email attribute is set" status="pending" />
      <CheckItem title="Signing in" status="running" />
    </CheckList>
  );
}

describe("CheckList", () => {
  it("says each result in words, beside its icon, in a list that announces changes", async () => {
    await render(<SamlChecks />);
    const items = page.getByRole("listitem").elements();
    expect(
      items.map((item) => item.querySelector("[data-slot=check-item-status]")?.textContent),
    ).toEqual(["Passed", "Failed", "Not run", "Running"]);
    expect(page.getByRole("list").element().getAttribute("aria-live")).toBe("polite");
    const failed = items[1]?.querySelector("[data-slot=check-item-status]") as HTMLElement;
    expect(getComputedStyle(failed).color).toBe(tokenColor("--qx-color-text-danger"));
    await expect.element(page.getByText("Checked 2 minutes ago")).toBeVisible();
  });

  it("puts the icon and the status on the title's first line, however long the check", async () => {
    const { container } = await render(
      <div style={{ inlineSize: 280 }}>
        <CheckList>
          <CheckItem
            title="The identity provider's signing certificate matches the one uploaded here"
            detail="The SHA-256 fingerprints differ: re-upload the certificate from your provider"
            status="failed"
          />
        </CheckList>
      </div>,
    );
    const box = (selector: string) =>
      (container.querySelector(selector) as HTMLElement).getBoundingClientRect();
    const title = box(".qx-check-item-title");
    // label.md's line: 14px × 1.428572, 20px.
    const firstLine = title.top + 10;
    expect(title.height).toBeGreaterThan(20); // the title wraps
    const icon = box(".qx-check-item-icon");
    const status = box(".qx-check-item-status");
    expect(icon.top + icon.height / 2).toBeCloseTo(firstLine, 0);
    expect(status.top + status.height / 2).toBeCloseTo(firstLine, 0);
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <SamlChecks />
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("CheckList");
  });
});
