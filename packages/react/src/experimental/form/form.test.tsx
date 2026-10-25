import { ArrowRightIcon } from "@qeetrix/icons/icons/arrow-right";
import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { Button } from "../../button/button";
import { Field } from "../../field/field";
import { Input } from "../../input/input";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { Form } from "./form";

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
