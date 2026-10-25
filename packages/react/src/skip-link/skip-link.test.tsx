import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tab } from "../../tests/support/keyboard";
import { hi } from "../locales/hi";
import { QeetrixProvider } from "../provider/provider";
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

    await tab();
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

  it("speaks QeetrixProvider's language, while staying server-safe", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <SkipLink />
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("link", { name: "मुख्य सामग्री पर जाएँ" })).toBeVisible();
  });

  it("takes its own strings over the provider's, and children over both", async () => {
    const { rerender } = await render(
      <QeetrixProvider messages={hi}>
        <SkipLink messages={{ label: "Skip to the users table" }} />
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("link", { name: "Skip to the users table" })).toBeVisible();
    await rerender(
      <QeetrixProvider messages={hi}>
        <SkipLink messages={{ label: "Skip to the users table" }}>Skip to results</SkipLink>
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("link", { name: "Skip to results" })).toBeVisible();
  });

  it("is accessible", async () => {
    const { container } = await render(<SkipLink />);
    await expectAccessible(container);
  });
});
