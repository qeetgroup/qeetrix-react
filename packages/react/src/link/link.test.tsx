import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
import { tab } from "../../tests/support/keyboard";
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

  it("wraps with its sentence, its arrow tied to the last word", async () => {
    const { container } = await render(
      <Text render={<p />} style={{ inlineSize: 240, margin: 0 }}>
        Read the{" "}
        <Link href="https://qeet.in/docs" external>
          integration guide for single sign-on with SAML
        </Link>{" "}
        first.
      </Text>,
    );
    const paragraph = container.querySelector("p") as HTMLElement;
    const link = page.getByRole("link").element() as HTMLElement;
    const icon = link.querySelector("[data-slot=link-icon]") as SVGElement;
    // Inline, not a box: the link starts on the sentence's first line and breaks across lines.
    const lines = link.getClientRects();
    expect(getComputedStyle(link).display).toBe("inline");
    expect(lines.length).toBeGreaterThan(1);
    expect((lines[0]?.top ?? 0) - paragraph.getBoundingClientRect().top).toBeLessThan(4);
    // At every width, the arrow stays on the last word's line, just after it.
    const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
    let text = walker.nextNode();
    while (text && !text.textContent?.includes("SAML")) text = walker.nextNode();
    const word = document.createRange();
    word.selectNodeContents(text as Node);
    word.setStart(text as Node, (text?.textContent ?? "").indexOf("SAML"));
    expect(link.textContent).toBe(
      "integration guide for single sign-on with SAML (opens in a new tab)",
    );
    for (let width = 120; width <= 420; width += 2) {
      paragraph.style.inlineSize = `${width}px`;
      const last = word.getBoundingClientRect();
      const arrow = icon.getBoundingClientRect();
      expect(arrow.top, `${width}px`).toBeGreaterThanOrEqual(last.top - 1);
      expect(arrow.bottom, `${width}px`).toBeLessThanOrEqual(last.bottom + 1);
      expect(arrow.left - last.right, `${width}px`).toBeGreaterThanOrEqual(0);
      expect(arrow.left - last.right, `${width}px`).toBeLessThanOrEqual(4);
    }
  });

  it("ties the arrow to the last word through trailing space, tabs and long unbroken text", async () => {
    const tail = async (text: string) => {
      const { container, unmount } = await render(
        <Link href="https://qeet.in" external>
          {text}
        </Link>,
      );
      const result = container.querySelector(".qx-link-tail")?.textContent;
      await unmount();
      return result;
    };
    expect(await tail("Read the guide  ")).toBe("guide  ");
    expect(await tail("Read\tthe\u00a0guide")).toBe("guide");
    expect(await tail("Docs")).toBe("Docs");
    expect(await tail("   ")).toBe("\u2060");
    // A long run without spaces: the old pattern backtracked quadratically on it.
    expect(await tail(`${"!".repeat(50_000)} a`)).toBe("a");
  });

  it("shows the Ember focus frame 2px outside", async () => {
    await render(<Link href="#x">Pricing</Link>);
    await tab();
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

  it("rendered as a button, for an action in place, keeps a link's look without a button's box", async () => {
    await render(
      <p>
        Opened from <Link render={<button type="button" />}>a related event</Link>.
      </p>,
    );
    const action = page.getByRole("button", { name: "a related event" }).element();
    const style = getComputedStyle(action);
    expect(style.borderTopWidth).toBe("0px");
    expect(style.paddingInlineStart).toBe("0px");
    expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(style.textDecorationLine).toBe("underline");
    expect(style.color).toBe(tokenColor("--qx-color-text-link"));
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        {/* Standalone links need room around them (WCAG 2.5.8); links in a sentence are exempt. */}
        <Stack gap="sm">
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
