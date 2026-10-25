/**
 * One form, every field type: their edges and heights must agree (design rules §8). Inputs, selects,
 * password and code fields span the column at the same height, and the Alert above and the
 * full-width Button below share their edges, in every density.
 */
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Alert, Combobox, OTPInput, PasswordInput } from "../src/experimental";
import { Button, Field, Input, Select, Stack } from "../src/index";
import { expectAccessible } from "./support/axe";
import { screenshotEveryMode } from "./support/screenshots";

function Form() {
  return (
    <div
      data-qx-stage=""
      style={{
        inlineSize: 400,
        padding: 24,
        background: "var(--qx-color-surface-canvas)",
        color: "var(--qx-color-text-default)",
        font: "var(--qx-typography-body-md)",
      }}
    >
      <Stack gap="lg">
        <Alert tone="info" title="Finish setting up your account">
          Add a password and turn on two-step sign-in.
        </Alert>
        <Field label="Work email">
          <Input defaultValue="priya@acme.in" />
        </Field>
        <Field label="Role">
          <Select
            items={[
              { value: "admin", label: "Administrator" },
              { value: "member", label: "Member" },
            ]}
            defaultValue="admin"
          />
        </Field>
        <Field label="Manager">
          <Combobox
            items={[
              { value: "usr_1", label: "Priya Sharma" },
              { value: "usr_2", label: "Rahul Verma" },
            ]}
            defaultValue="usr_1"
          />
        </Field>
        <Field label="Password">
          <PasswordInput autoComplete="new-password" defaultValue="correct horse battery" />
        </Field>
        <Field label="Verification code">
          <OTPInput defaultValue="4817" />
        </Field>
        <Button fullWidth size="lg">
          Save and continue
        </Button>
      </Stack>
    </div>
  );
}

const box = (selector: string) => {
  const element = document.querySelector(selector) as HTMLElement;
  return element.getBoundingClientRect();
};

describe("form consistency", () => {
  it("lines every field, the alert and the button up on both edges", async () => {
    await page.viewport(600, 860);
    await render(<Form />);
    const parts = [
      "[data-slot=alert]",
      "[data-slot=input]",
      ".qx-select-trigger",
      "[data-slot=combobox]",
      ".qx-password-input",
      "[data-slot=otp-input]",
      "[data-slot=button]",
    ].map(box);
    const [first] = parts;
    for (const part of parts) {
      expect(part.left).toBe(first?.left);
      expect(part.right).toBe(first?.right);
    }
  });

  it("gives every field, and the form's lg button, the same height", async () => {
    await page.viewport(600, 860);
    await render(<Form />);
    const heights = [
      "[data-slot=input]",
      ".qx-select-trigger",
      "[data-slot=combobox]",
      ".qx-password-input",
      "[data-slot=otp-input-slot]",
      "[data-slot=button]",
    ].map((selector) => box(selector).height);
    expect(new Set(heights).size).toBe(1);
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(600, 860);
    const { container } = await render(<Form />);
    await expectAccessible(container);
    await screenshotEveryMode("Form consistency", "[data-qx-stage]");
  });
});
