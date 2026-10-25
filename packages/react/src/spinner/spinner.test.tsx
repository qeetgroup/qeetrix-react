import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Inline } from "../inline/inline";
import { hi } from "../locales/hi";
import { QeetrixProvider } from "../provider/provider";
import { Spinner } from "./spinner";

describe("Spinner", () => {
  it("announces itself as a status named Loading", async () => {
    await render(<Spinner />);
    await expect.element(page.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("takes another label, or hides when something else announces the wait", async () => {
    await render(
      <>
        <Spinner label="Loading invoices" />
        <Spinner decorative />
      </>,
    );
    await expect
      .element(page.getByRole("status", { name: "Loading invoices" }))
      .toBeInTheDocument();
    expect(page.getByRole("status").elements()).toHaveLength(1);
  });

  it("says the provider's language when it has no label of its own", async () => {
    // Regression: a standalone Spinner read only the English default, so it said "Loading" in Hindi.
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <Spinner />
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("status", { name: "लोड हो रहा है" })).toBeInTheDocument();
    // The name is hidden text: it adds nothing to the ring's size.
    const spinner = page.getByRole("status").element();
    expect(spinner.getBoundingClientRect().width).toBe(16);
  });

  it("lets its own label, or an aria-label, win over the provider's", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <Spinner label="चालान लोड हो रहे हैं" />
        <Spinner aria-label="Fetching users" />
      </QeetrixProvider>,
    );
    await expect
      .element(page.getByRole("status", { name: "चालान लोड हो रहे हैं" }))
      .toBeInTheDocument();
    await expect.element(page.getByRole("status", { name: "Fetching users" })).toBeInTheDocument();
    expect(document.querySelectorAll("[data-slot=spinner-label]")).toHaveLength(0);
  });

  it("calls the text-coloured tone neutral, and keeps default as its alias", async () => {
    const { container } = await render(
      <div style={{ color: "var(--qx-color-text-danger)" }}>
        <Spinner tone="neutral" />
        <Spinner tone="default" />
        <Spinner />
        <Spinner tone="brand" />
      </div>,
    );
    const colours = [...container.querySelectorAll<HTMLElement>("[data-slot=spinner]")].map(
      (spinner) => getComputedStyle(spinner).borderTopColor,
    );
    const text = tokenColor("--qx-color-text-danger");
    expect(colours).toEqual([text, text, text, tokenColor("--qx-color-icon-brand")]);
  });

  it("is 14, 16, 20 and 24px", async () => {
    const { container } = await render(
      <>
        <Spinner size="sm" />
        <Spinner />
        <Spinner size="lg" />
        <Spinner size="xl" />
      </>,
    );
    const widths = [...container.querySelectorAll("[data-slot=spinner]")].map(
      (el) => el.getBoundingClientRect().width,
    );
    expect(widths).toEqual([14, 16, 20, 24]);
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <Inline gap="md">
          <Spinner size="sm" />
          <Spinner />
          <Spinner size="lg" tone="brand" />
          <Spinner size="xl" />
        </Inline>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Spinner");
  });

  it("is accessible and looks right in each tone, in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <Inline gap="md">
          <Spinner size="xl" tone="neutral" />
          <span style={{ color: "var(--qx-color-text-subtle)" }}>
            <Spinner size="xl" tone="neutral" label="Loading invoices" />
          </span>
          <Spinner size="xl" tone="brand" />
        </Inline>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Spinner · tones");
  });
});
