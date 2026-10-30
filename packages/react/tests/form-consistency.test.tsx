/**
 * One form, every field type: their edges and heights must agree (design rules §8). Inputs, selects,
 * dates, password and code fields span the column at the same height, and the Alert above and the
 * full-width Button below share their edges, in every density.
 */
import { ArrowRightIcon } from "@qeetrix/icons/icons/arrow-right";
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  Alert,
  Combobox,
  CopyField,
  DatePicker,
  DateRangePicker,
  NumberField,
  OTPInput,
  PasswordInput,
} from "../src/experimental";
import { Button, Field, Input, Select, Stack, Textarea } from "../src/index";
import { expectAccessible } from "./support/axe";
import { tokenColor } from "./support/color";
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
        <Field label="Joining date">
          <DatePicker defaultValue="2026-10-25" />
        </Field>
        <Field label="Audit period">
          <DateRangePicker defaultValue={{ start: "2026-10-01", end: "2026-10-25" }} />
        </Field>
        <Field label="Session timeout">
          <NumberField defaultValue={30} endAdornment="minutes" />
        </Field>
        <Field label="Password">
          <PasswordInput autoComplete="new-password" defaultValue="correct horse battery" />
        </Field>
        <Field label="Verification code">
          <OTPInput defaultValue="4817" />
        </Field>
        <Button fullWidth size="lg" icon={ArrowRightIcon}>
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
    await page.viewport(600, 960);
    await render(<Form />);
    const parts = [
      "[data-slot=alert]",
      "[data-slot=input]",
      ".qx-select-trigger",
      "[data-slot=combobox]",
      "[data-slot=number-field]",
      ".qx-date-picker",
      ".qx-date-range-picker",
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
    await page.viewport(600, 960);
    await render(<Form />);
    const heights = [
      "[data-slot=input]",
      ".qx-select-trigger",
      "[data-slot=combobox]",
      "[data-slot=number-field]",
      ".qx-date-picker",
      ".qx-date-range-picker",
      ".qx-password-input",
      "[data-slot=otp-input-slot]",
      "[data-slot=button]",
    ].map((selector) => box(selector).height);
    expect(new Set(heights).size).toBe(1);
  });

  it("draws every read-only field with no fill and the editable field's 3:1 line (QTRX-175)", async () => {
    const { container } = await render(
      <Stack gap="md">
        <Field label="Account ID">
          <Input defaultValue="acc_7f3k29" readOnly />
        </Field>
        <Field label="Notes">
          <Textarea defaultValue="Signed up in 2024." readOnly />
        </Field>
        <Field label="Role">
          <Select
            readOnly
            items={[{ value: "admin", label: "Administrator" }]}
            defaultValue="admin"
          />
        </Field>
        <Field label="Manager">
          <Combobox
            readOnly
            items={[{ value: "usr_1", label: "Priya Sharma" }]}
            defaultValue="usr_1"
          />
        </Field>
        <Field label="Seats">
          <NumberField readOnly defaultValue={12} />
        </Field>
        <Field label="Code">
          <OTPInput readOnly defaultValue="482913" />
        </Field>
        <CopyField label="Client ID" value="cli_29fk3" />
      </Stack>,
    );
    const line = `${tokenColor("--qx-color-border-strong")} 0px -1px 0px 0px inset`;
    const parts = [
      "[data-slot=input]",
      ".qx-textarea",
      ".qx-select-trigger",
      "[data-slot=combobox]",
      "[data-slot=number-field]",
      "[data-slot=otp-input-slot]",
      ".qx-copy-field-box",
    ].map((selector) => container.querySelector(selector) as HTMLElement);
    for (const part of parts) {
      const style = getComputedStyle(part);
      expect(style.boxShadow, part.className).toBe(line);
      expect(style.backgroundColor, part.className).toBe("rgba(0, 0, 0, 0)");
    }
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(600, 960);
    const { container } = await render(<Form />);
    await expectAccessible(container);
    await screenshotEveryMode("Form consistency", "[data-qx-stage]");
  });
});
