import { ArrowRightIcon } from "@qeetrix/icons/icons/arrow-right";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tab } from "../../../tests/support/keyboard";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { Button } from "../../button/button";
import { Checkbox, CheckboxGroup } from "../../checkbox/checkbox";
import { Field } from "../../field/field";
import { Input } from "../../input/input";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { Radio, RadioGroup } from "../../radio/radio";
import { Select } from "../../select/select";
import { Slider } from "../../slider/slider";
import { TextField } from "../../text-field/text-field";
import { ErrorSummary, Form } from "./form";

const required = (message: string) => (value: unknown) => (value ? null : message);

function Invite({
  onFormSubmit,
  errors,
  summary,
}: {
  onFormSubmit?: (values: Record<string, unknown>) => void;
  errors?: Record<string, string>;
  summary?: boolean;
}) {
  return (
    <Form
      aria-label="Invite a user"
      {...(onFormSubmit ? { onFormSubmit } : {})}
      {...(errors ? { errors } : {})}
      {...(summary === undefined ? {} : { summary })}
      style={{ inlineSize: 400 }}
    >
      <Field label="Full name" name="name" validate={required("Enter the person's name")}>
        <Input />
      </Field>
      <Field label="Work email" name="email" validate={required("Enter a work email")}>
        <Input type="email" />
      </Field>
      <Button type="submit" size="lg" fullWidth icon={ArrowRightIcon}>
        Send invitation
      </Button>
    </Form>
  );
}

const SERVER_ERRORS = {
  email: "priya@acme.in is already a member",
  cycle: "Yearly billing isn't available on this plan",
  notify: "Choose at least one way to notify",
  role: "Choose a role",
  terms: "Accept the terms to continue",
  seats: "Choose at most 50 seats",
};

function Billing({ withErrors }: { withErrors: boolean }) {
  return (
    <Form aria-label="Billing" {...(withErrors ? { errors: SERVER_ERRORS } : {})}>
      <TextField label="Work email" name="email" />
      <RadioGroup label="Billing cycle" name="cycle">
        <Radio value="monthly" label="Monthly" />
        <Radio value="yearly" label="Yearly" />
      </RadioGroup>
      <CheckboxGroup label="Notify me by" name="notify">
        <Checkbox value="email" label="Email" />
        <Checkbox value="sms" label="SMS" />
      </CheckboxGroup>
      <Field label="Role" name="role">
        <Select items={[{ value: "admin", label: "Administrator" }]} />
      </Field>
      <Field label="Terms" name="terms">
        <Checkbox label="I accept the terms" />
      </Field>
      <Slider label="Seats" name="seats" description="Billed per seat." defaultValue={60} />
    </Form>
  );
}

function Checkout({ autoFocus }: { autoFocus?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <>
      {failed && (
        <ErrorSummary
          items={[{ id: "pan", message: "Enter a PAN" }, { message: "Your session expired" }]}
          {...(autoFocus === undefined ? {} : { autoFocus })}
        />
      )}
      <label htmlFor="pan">PAN</label>
      <input id="pan" />
      <button type="button" onClick={() => setFailed(true)}>
        Pay
      </button>
    </>
  );
}

const summary = () => document.querySelector(".qx-error-summary") as HTMLElement | null;

describe("Form", () => {
  it("spaces its fields by the form gap", async () => {
    const { container } = await render(<Invite />);
    const form = container.querySelector("form") as HTMLElement;
    const probe = document.createElement("div");
    probe.style.inlineSize = "var(--qx-space-form-gap)";
    form.append(probe);
    expect(getComputedStyle(form).rowGap).toBe(`${probe.getBoundingClientRect().width}px`);
    probe.remove();
  });

  it("on a failed submit, lists the problems at the top in the fields' own words, and focuses them", async () => {
    const onFormSubmit = vi.fn();
    await render(<Invite onFormSubmit={onFormSubmit} />);
    await page.getByRole("button", { name: "Send invitation" }).click();
    await expect.poll(() => summary()).not.toBeNull();
    expect(onFormSubmit).not.toHaveBeenCalled();
    expect(summary()?.querySelector("[data-slot=alert-title]")?.textContent).toBe(
      "Error: Fix these to continue",
    );
    const links = [...(summary()?.querySelectorAll("a") ?? [])].map((link) => link.textContent);
    expect(links).toEqual(["Enter the person's name", "Enter a work email"]);
    await expect
      .element(page.getByText("Enter a work email", { exact: true }).last())
      .toBeVisible();
    await expect.poll(() => document.activeElement).toBe(summary());
  });

  it("focuses the field from its summary link", async () => {
    await render(<Invite />);
    await page.getByRole("button", { name: "Send invitation" }).click();
    await expect.poll(() => summary()).not.toBeNull();
    await page.getByRole("link", { name: "Enter a work email" }).click();
    await expect.element(page.getByRole("textbox", { name: "Work email" })).toHaveFocus();
  });

  it("sends the values when everything is valid, and clears the summary", async () => {
    const onFormSubmit = vi.fn();
    await render(<Invite onFormSubmit={onFormSubmit} />);
    await page.getByRole("button", { name: "Send invitation" }).click();
    await expect.poll(() => summary()).not.toBeNull();
    await page.getByRole("textbox", { name: "Full name" }).fill("Priya Sharma");
    await page.getByRole("textbox", { name: "Work email" }).fill("priya@acme.in");
    await page.getByRole("button", { name: "Send invitation" }).click();
    await expect.poll(() => onFormSubmit.mock.calls.length).toBe(1);
    expect(onFormSubmit.mock.calls[0]?.[0]).toEqual({
      name: "Priya Sharma",
      email: "priya@acme.in",
    });
    await expect.poll(() => summary()).toBeNull();
  });

  it("summarises server errors when they arrive", async () => {
    const { rerender } = await render(<Invite />);
    await rerender(<Invite errors={{ email: "priya@acme.in is already a member" }} />);
    await expect
      .poll(() => summary()?.querySelector("a")?.textContent)
      .toBe("priya@acme.in is already a member");
    await expect.poll(() => document.activeElement).toBe(summary());
    // An equal errors object on the next render changes nothing.
    await rerender(<Invite errors={{ email: "priya@acme.in is already a member" }} />);
    expect(summary()?.querySelectorAll("a")).toHaveLength(1);
  });

  it("can leave the summary out", async () => {
    await render(<Invite summary={false} />);
    await page.getByRole("button", { name: "Send invitation" }).click();
    await expect.element(page.getByText("Enter a work email")).toBeVisible();
    expect(summary()).toBeNull();
  });

  it("speaks Hindi through QeetrixProvider", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <Invite />
      </QeetrixProvider>,
    );
    await page.getByRole("button", { name: "Send invitation" }).click();
    await expect
      .poll(() => summary()?.querySelector("[data-slot=alert-title]")?.textContent)
      .toBe("त्रुटि: जारी रखने के लिए इन्हें ठीक करें");
  });

  it("summarises a TextField and a RadioGroup after a failed submit, linking to their controls", async () => {
    await render(
      <Form aria-label="Billing" style={{ inlineSize: 400 }}>
        <TextField label="Work email" name="email" validate={required("Enter a work email")} />
        <RadioGroup label="Billing cycle" name="cycle" required>
          <Radio value="monthly" label="Monthly" />
          <Radio value="yearly" label="Yearly" />
        </RadioGroup>
        <Button type="submit">Continue</Button>
      </Form>,
    );
    await page.getByRole("button", { name: "Continue" }).click();
    await expect.poll(() => summary()?.querySelectorAll("a").length).toBe(2);
    const [email, cycle] = [...(summary()?.querySelectorAll("a") ?? [])];
    const cycleError = document.querySelector(
      "[data-slot=radio-group] [data-slot=field-error]",
    ) as HTMLElement;
    expect(email?.textContent).toBe("Enter a work email");
    expect(cycle?.textContent).toBe(cycleError.textContent?.trim());
    const input = page.getByRole("textbox", { name: "Work email" }).element();
    const monthly = page.getByRole("radio", { name: "Monthly" }).element();
    expect(email?.getAttribute("href")).toBe(`#${input.id}`);
    // A group's item links to its first option, as GOV.UK's does.
    expect(cycle?.getAttribute("href")).toBe(`#${monthly.id}`);
    await page.getByRole("link", { name: cycle?.textContent ?? "" }).click();
    await expect.element(page.getByRole("radio", { name: "Monthly" })).toHaveFocus();
  });

  it("summarises server errors on every kind of row: groups, a Slider, and controls inside a Field", async () => {
    const { rerender } = await render(<Billing withErrors={false} />);
    await rerender(<Billing withErrors />);
    await expect.poll(() => summary()?.querySelectorAll("a").length).toBe(6);
    const links = [...(summary()?.querySelectorAll("a") ?? [])];
    const target = (name: string, role: "textbox" | "radio" | "checkbox" | "combobox" | "slider") =>
      `#${page.getByRole(role, { name, exact: true }).element().id}`;
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      [SERVER_ERRORS.email, target("Work email", "textbox")],
      [SERVER_ERRORS.cycle, target("Monthly", "radio")],
      [SERVER_ERRORS.notify, target("Email", "checkbox")],
      [SERVER_ERRORS.role, target("Role", "combobox")],
      [SERVER_ERRORS.terms, target("I accept the terms", "checkbox")],
      [SERVER_ERRORS.seats, target("Seats", "slider")],
    ]);
    await page.getByRole("link", { name: SERVER_ERRORS.terms }).click();
    await expect.element(page.getByRole("checkbox", { name: "I accept the terms" })).toHaveFocus();
  });

  it("titles its summary with a heading inside an alert, at the level asked for", async () => {
    await render(
      <Form aria-label="Invite" summaryHeadingLevel={3}>
        <TextField label="Work email" name="email" validate={required("Enter a work email")} />
        <Button type="submit">Send</Button>
      </Form>,
    );
    await page.getByRole("button", { name: "Send" }).click();
    const alert = page.getByRole("alert");
    await expect
      .element(alert.getByRole("heading", { level: 3, name: "Fix these to continue" }))
      .toBeVisible();
    await expect.poll(() => document.activeElement).toBe(summary());
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(520, 520);
    const { container } = await render(
      <div
        data-qx-stage=""
        style={{ padding: 24, inlineSize: 448, background: "var(--qx-color-surface-canvas)" }}
      >
        <Invite />
      </div>,
    );
    await page.getByRole("button", { name: "Send invitation" }).click();
    await expect.poll(() => summary()).not.toBeNull();
    await expectAccessible(container);
    await screenshotEveryMode("Form", "[data-qx-stage]");
  });
});

describe("ErrorSummary", () => {
  it("is an alert titled by a heading, and takes focus when it appears, on its own too", async () => {
    await render(<Checkout />);
    await page.getByRole("button", { name: "Pay" }).click();
    const alert = page.getByRole("alert");
    await expect
      .element(alert.getByRole("heading", { level: 2, name: "Fix these to continue" }))
      .toBeVisible();
    await expect.poll(() => document.activeElement).toBe(summary());
    // GOV.UK: focusable only until focus leaves it, so a later click doesn't frame it again.
    expect(summary()?.getAttribute("tabindex")).toBe("-1");
    await tab();
    await expect.element(page.getByRole("link", { name: "Enter a PAN" })).toHaveFocus();
    expect(summary()?.hasAttribute("tabindex")).toBe(false);
    // An item without an id is plain text.
    await expect.element(alert.getByText("Your session expired")).toBeVisible();
    expect(alert.getByRole("link", { name: "Your session expired" }).query()).toBeNull();
  });

  it("leaves focus where it is with autoFocus off", async () => {
    await render(<Checkout autoFocus={false} />);
    // From the keyboard, so the button has focus in WebKit too, which doesn't focus on click.
    page.getByRole("button", { name: "Pay" }).element().focus();
    await userEvent.keyboard("{Enter}");
    await expect.element(page.getByRole("alert")).toBeVisible();
    await expect.element(page.getByRole("button", { name: "Pay" })).toHaveFocus();
  });

  it("is accessible", async () => {
    const { container } = await render(<Checkout />);
    await page.getByRole("button", { name: "Pay" }).click();
    await expect.element(page.getByRole("alert")).toBeVisible();
    await expectAccessible(container);
  });
});
