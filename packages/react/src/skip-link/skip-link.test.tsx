import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { SkipLink } from "./skip-link";

describe("SkipLink", () => {
  it("is hidden until focused, then visible with the focus frame", async () => {
    await render(
      <>
        <SkipLink />
        <nav>
          <a href="#a">Overview</a>
        </nav>
        <main id="main">Main content</main>
      </>,
    );
    const link = page.getByRole("link", { name: "Skip to main content" });
    const element = link.element() as HTMLElement;
    expect(element.getBoundingClientRect().width).toBeLessThanOrEqual(1);

    await userEvent.keyboard("{Tab}");
    await expect.element(link).toHaveFocus();
    expect(element.getBoundingClientRect().width).toBeGreaterThan(40);
    expect(getComputedStyle(element).outlineStyle).toBe("solid");
  });

  it("takes a translated label and another target", async () => {
    await render(<SkipLink href="#content">Zum Inhalt springen</SkipLink>);
    await expect
      .element(page.getByRole("link", { name: "Zum Inhalt springen" }))
      .toHaveAttribute("href", "#content");
  });

  it("is accessible", async () => {
    const { container } = await render(<SkipLink />);
    await expectAccessible(container);
  });
});
