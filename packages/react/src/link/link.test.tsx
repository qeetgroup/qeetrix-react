import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Stack } from "../stack/stack";
import { Text } from "../text/text";
import { Link } from "./link";

describe("Link", () => {
  it("opens external links safely and says so to screen readers", async () => {
    const { container } = await render(
      <Link href="https://qeet.in" external>
        Qeet Group
      </Link>,
    );
    const link = page.getByRole("link", { name: "Qeet Group (opens in a new tab)" });
    await expect.element(link).toHaveAttribute("target", "_blank");
    await expect.element(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(container.querySelector("[data-slot=link-icon]")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("shows the Ember focus frame 2px outside", async () => {
    await render(<Link href="#x">Pricing</Link>);
    await userEvent.keyboard("{Tab}");
    const style = getComputedStyle(page.getByRole("link", { name: "Pricing" }).element());
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineOffset).toBe("2px");
  });

  it("renders a router link through the render prop", async () => {
    await render(
      <Link render={<a data-router="" href="/invoices" />} tone="subtle">
        Invoices
      </Link>,
    );
    const link = page.getByRole("link", { name: "Invoices" });
    await expect.element(link).toHaveAttribute("data-router", "");
    await expect.element(link).toHaveAttribute("data-slot", "link");
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <Stack gap="xs">
          <Text>
            Read the <Link href="#guide">integration guide</Link> first.
          </Text>
          <Link href="https://qeet.in/status" external>
            System status
          </Link>
          <Text size="sm">
            <Link href="#terms" tone="subtle">
              Terms
            </Link>
          </Text>
        </Stack>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Link");
  });
});
