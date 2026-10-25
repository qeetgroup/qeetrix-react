import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Inline } from "../inline/inline";
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
});
