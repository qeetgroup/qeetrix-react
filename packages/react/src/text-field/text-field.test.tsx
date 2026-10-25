import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Stack } from "../stack/stack";
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

  it("replaces its description with an error for assistive technology too", async () => {
    const { container } = await render(
      <TextField label="PAN" description="10 characters." error="PAN has 10 characters." />,
    );
    const input = page.getByRole("textbox", { name: "PAN" });
    await expect.element(input).toHaveAccessibleDescription("PAN has 10 characters.");
    expect(container.querySelector("[data-slot=field-description]")).toBeNull();
  });

  it("puts help behind an ⓘ after the label, like Field, and stays level with its neighbours", async () => {
    await render(
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <TextField
          label="Access token lifetime"
          help="How long an access token stays valid after sign-in."
          defaultValue="60"
        />
        <TextField label="Refresh token lifetime" defaultValue="30" />
      </div>,
    );
    const button = page.getByRole("button", { name: "About Access token lifetime" });
    await button.click();
    const dialog = page.getByRole("dialog", { name: "Access token lifetime" });
    await expect.element(dialog.getByText(/stays valid after sign-in/)).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect.element(button).toHaveFocus();
    // The label still names the input.
    await expect
      .element(page.getByRole("textbox", { name: "Access token lifetime" }))
      .toHaveValue("60");
    const inputs = [...document.querySelectorAll<HTMLElement>(".qx-input")];
    for (const density of ["compact", "default", "comfortable"]) {
      document.documentElement.dataset.qxDensity = density;
      const [withHelp, without] = inputs.map((input) => input.getBoundingClientRect().top);
      expect(Math.abs((withHelp ?? 0) - (without ?? 0)), density).toBeLessThan(0.5);
    }
    delete document.documentElement.dataset.qxDensity;
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <Stack gap="lg" style={{ inlineSize: 280 }}>
          <TextField label="Trade name" optional description="As registered with the MCA." />
          <TextField
            label="Session timeout"
            help="Idle minutes before sign-out."
            description="5 to 1,440 minutes"
            defaultValue="30"
            endAdornment="minutes"
          />
        </Stack>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("TextField");
  });
});
