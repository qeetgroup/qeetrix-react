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
