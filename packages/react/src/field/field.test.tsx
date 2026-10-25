import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Input } from "../input/input";
import { Link } from "../link/link";
import { hi } from "../locales/hi";
import { QeetrixProvider } from "../provider/provider";
import { Stack } from "../stack/stack";
import { Field } from "./field";

describe("Field", () => {
  it("names the control by its label and describes it with the help text", async () => {
    await render(
      <Field label="GSTIN" description="15 characters.">
        <Input />
      </Field>,
    );
    const input = page.getByRole("textbox", { name: "GSTIN" });
    await expect.element(input).toHaveAccessibleDescription("15 characters.");
  });

  it("marks optional fields, never required ones", async () => {
    const { container } = await render(
      <Field label="Trade name" optional>
        <Input />
      </Field>,
    );
    await expect
      .element(page.getByRole("textbox", { name: "Trade name (optional)" }))
      .toBeVisible();
    expect(container.textContent).not.toContain("*");
  });

  it("shows an error in place of the help text and marks the control invalid", async () => {
    const { container } = await render(
      <Field label="PAN" description="10 characters." error="PAN has 10 characters.">
        <Input defaultValue="ABCDE12" />
      </Field>,
    );
    const input = page.getByRole("textbox", { name: "PAN" });
    await expect.element(input).toHaveAttribute("aria-invalid", "true");
    const error = container.querySelector("[data-slot=field-error]") as HTMLElement;
    expect(error.textContent).toBe("PAN has 10 characters.");
    expect(error.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    const description = container.querySelector("[data-slot=field-description]") as HTMLElement;
    expect(getComputedStyle(description).display).toBe("none");
  });

  it("shows the browser's message when validation fails", async () => {
    // A next field to Tab to: Firefox keeps focus on the only control in the frame.
    const { container } = await render(
      <>
        <Field label="Work email" validationMode="onBlur">
          <Input type="email" required />
        </Field>
        <Field label="Company">
          <Input />
        </Field>
      </>,
    );
    await userEvent.click(page.getByRole("textbox", { name: "Work email" }));
    await userEvent.keyboard("priya");
    await userEvent.keyboard("{Tab}");
    await expect
      .element(page.getByRole("textbox", { name: "Work email" }))
      .toHaveAttribute("aria-invalid", "true");
    const error = container.querySelector("[data-slot=field-error]") as HTMLElement;
    expect(error.textContent?.length).toBeGreaterThan(0);
  });

  it("can hide its label visually and keep the name", async () => {
    const { container } = await render(
      <Field label="Search invoices" hideLabel>
        <Input />
      </Field>,
    );
    await expect.element(page.getByRole("textbox", { name: "Search invoices" })).toBeVisible();
    const label = container.querySelector("[data-slot=field-label]") as HTMLElement;
    expect(label.getBoundingClientRect().width).toBe(1);
  });

  it("puts help behind an ⓘ named for the field, in a popover titled with the label", async () => {
    await render(
      <Field
        label="Access token lifetime"
        help={
          <>
            How long an access token stays valid after sign-in.{" "}
            <Link href="#tokens">How tokens work</Link>
          </>
        }
      >
        <Input defaultValue="60" />
      </Field>,
    );
    const button = page.getByRole("button", { name: "About Access token lifetime" });
    await expect.element(button).toHaveAttribute("aria-expanded", "false");
    await button.click();
    const dialog = page.getByRole("dialog", { name: "Access token lifetime" });
    await expect.element(dialog).toBeVisible();
    await expect.element(dialog.getByText(/stays valid after sign-in/)).toBeVisible();
    await expect.element(dialog.getByRole("link", { name: "How tokens work" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await expect.element(button).toHaveFocus();
    // The label still names the input, and a click on it still focuses the input.
    await page.getByText("Access token lifetime").click();
    await expect
      .element(page.getByRole("textbox", { name: "Access token lifetime" }))
      .toHaveFocus();
  });

  it("keeps a field with help level with its neighbours, at every density", async () => {
    await render(
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Access token lifetime" help="How long an access token stays valid.">
          <Input defaultValue="60" />
        </Field>
        <Field label="Refresh token lifetime">
          <Input defaultValue="30" />
        </Field>
      </div>,
    );
    const inputs = [...document.querySelectorAll<HTMLElement>(".qx-input")];
    for (const density of ["compact", "default", "comfortable"]) {
      document.documentElement.dataset.qxDensity = density;
      const [withHelp, without] = inputs.map((input) => input.getBoundingClientRect().top);
      // On the same pixel: line heights are ratios, so tops differ by fractions.
      expect(Math.abs((withHelp ?? 0) - (without ?? 0)), density).toBeLessThan(0.5);
    }
    delete document.documentElement.dataset.qxDensity;
  });

  it("names the ⓘ plainly when the label isn't text, and speaks Hindi", async () => {
    await render(
      <>
        <Field label={<strong>Tenant</strong>} help="Your organisation in Qeet ID.">
          <Input />
        </Field>
        <QeetrixProvider locale="hi-IN" messages={hi}>
          <Field label="अवधि" help="टोकन कितनी देर मान्य रहता है।">
            <Input />
          </Field>
        </QeetrixProvider>
      </>,
    );
    await expect.element(page.getByRole("button", { name: "More information" })).toBeVisible();
    await expect.element(page.getByRole("button", { name: "अवधि के बारे में" })).toBeVisible();
  });

  it("is accessible and looks right in every mode", async () => {
    // Wide enough for the help to open beside its ⓘ, as on a settings page.
    await page.viewport(760, 560);
    const { container } = await render(
      <Stage>
        <Stack gap="lg" style={{ inlineSize: 280 }}>
          <Field label="Trade name" optional description="As registered with the MCA.">
            <Input placeholder="e.g. Acme Pvt Ltd" />
          </Field>
          <Field label="PAN" error="PAN has 10 characters.">
            <Input defaultValue="ABCDE12" />
          </Field>
          <Field label="Legacy code" disabled description="Disabled.">
            <Input defaultValue="LGC-0042" />
          </Field>
          <Field
            label="Access token lifetime"
            description="5 to 1,440 minutes"
            help="How long an access token stays valid after sign-in."
          >
            <Input defaultValue="60" endAdornment="minutes" />
          </Field>
        </Stack>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("Field");
    // The help open: the popover sits beside the ⓘ, outside the stage, so the whole view.
    await page.getByRole("button", { name: "About Access token lifetime" }).click();
    await expect.element(page.getByRole("dialog")).toBeVisible();
    await expectAccessible(document.querySelector("[role=dialog]") as HTMLElement);
    await screenshotEveryMode("Field · help", null);
  });
});
