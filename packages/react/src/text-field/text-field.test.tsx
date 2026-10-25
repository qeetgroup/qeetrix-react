import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { TextField } from "./text-field";

describe("TextField", () => {
  it("sends ref and input props to the input, and the name to the form", async () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = await render(
      <form>
        <TextField ref={ref} label="GSTIN" name="gstin" required autoComplete="off" />
      </form>,
    );
    const input = page.getByRole("textbox", { name: "GSTIN" });
    expect(ref.current).toBe(input.element());
    await expect.element(input).toBeRequired();
    await expect.element(input).toHaveAttribute("autocomplete", "off");
    await userEvent.type(input, "29ABCDE1234F1Z5");
    const data = new FormData(container.querySelector("form") as HTMLFormElement);
    expect(data.get("gstin")).toBe("29ABCDE1234F1Z5");
  });

  it("places the row with className and shows a server error", async () => {
    const { container } = await render(
      <TextField label="PAN" className="span-2" error="This PAN is already registered." />,
    );
    const root = container.querySelector("[data-slot=text-field]") as HTMLElement;
    expect(root.classList).toContain("span-2");
    await expect
      .element(page.getByRole("textbox", { name: "PAN" }))
      .toHaveAccessibleDescription("This PAN is already registered.");
  });

  it("is accessible", async () => {
    const { container } = await render(
      <TextField label="Trade name" optional description="As registered with the MCA." />,
    );
    await expectAccessible(container);
  });
});
