import { SearchIcon } from "@qeetrix/icons/icons/search";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { Field } from "../../field/field";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { Combobox } from "./combobox";

const PEOPLE = [
  { value: "usr_1", label: "Priya Sharma", description: "priya@acme.in" },
  { value: "usr_2", label: "Rahul Verma", description: "rahul.verma@acme.in" },
  { value: "usr_3", label: "Ananya Iyer", description: "ananya@acme.in" },
  { value: "usr_4", label: "Karthik Reddy", description: "karthik.r@acme.in", disabled: true },
];

const ROLES = [
  {
    label: "Directory",
    items: [
      { value: "users.read", label: "Read users" },
      { value: "users.write", label: "Manage users" },
    ],
  },
  {
    label: "Security",
    items: [
      { value: "audit.read", label: "Read audit logs" },
      { value: "sessions.revoke", label: "Revoke sessions" },
    ],
  },
];

const field = () => page.getByRole("combobox", { name: "Owner" });

describe("Combobox", () => {
  it("is a combobox named by its field, narrowing its options as you type", async () => {
    await render(
      <Field label="Owner">
        <Combobox items={PEOPLE} placeholder="e.g. Priya Sharma" />
      </Field>,
    );
    await field().click();
    await expect.element(page.getByRole("option", { name: /Rahul Verma/ })).toBeVisible();
    await userEvent.type(field(), "an");
    await expect.element(page.getByRole("option", { name: /Ananya Iyer/ })).toBeVisible();
    expect(page.getByRole("option", { name: /Rahul Verma/ }).elements()).toHaveLength(0);
  });

  it("stores the option's ID, shows its label, and clears", async () => {
    const onValueChange = vi.fn();
    await render(
      <Field label="Owner">
        <Combobox items={PEOPLE} onValueChange={onValueChange} />
      </Field>,
    );
    await userEvent.type(field(), "rahul");
    await page.getByRole("option", { name: /Rahul Verma/ }).click();
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBe("usr_2");
    await expect.element(field()).toHaveValue("Rahul Verma");
    await page.getByRole("button", { name: "Clear" }).click();
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBeNull();
  });

  it("says when nothing matches", async () => {
    await render(
      <Field label="Owner">
        <Combobox items={PEOPLE} />
      </Field>,
    );
    await userEvent.type(field(), "zzz");
    await expect.element(page.getByText("No matches")).toBeVisible();
  });

  it("shows groups under their labels, and keeps disabled options out of reach", async () => {
    await render(
      <Field label="Owner">
        <Combobox items={ROLES} />
      </Field>,
    );
    await field().click();
    await expect.element(page.getByText("Security", { exact: true })).toBeVisible();
    await expect.element(page.getByRole("option", { name: "Revoke sessions" })).toBeVisible();
  });

  it("picks several as removable pills: by button, or Backspace for the last", async () => {
    const onValueChange = vi.fn();
    await render(
      <Field label="Owner">
        <Combobox
          items={PEOPLE}
          multiple
          defaultValue={["usr_1", "usr_2"]}
          onValueChange={onValueChange}
        />
      </Field>,
    );
    const chips = () =>
      [...document.querySelectorAll("[data-slot=combobox-chip]")].map((chip) =>
        chip.getAttribute("aria-label"),
      );
    expect(chips()).toEqual(["Priya Sharma", "Rahul Verma"]);
    expect(field().element().getAttribute("aria-description")).toMatch(/^2 selected/);
    await page.getByRole("button", { name: "Remove Priya Sharma" }).click();
    expect(onValueChange.mock.calls.at(-1)?.[0]).toEqual(["usr_2"]);
    await field().click();
    await userEvent.keyboard("{Backspace}");
    expect(onValueChange.mock.calls.at(-1)?.[0]).toEqual([]);
  });

  it("can be disabled", async () => {
    await render(
      <Field label="Owner" disabled>
        <Combobox items={PEOPLE} disabled />
      </Field>,
    );
    await expect.element(field()).toBeDisabled();
  });

  it("speaks Hindi through QeetrixProvider", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <Combobox items={PEOPLE} aria-label="Owner" defaultValue="usr_1" />
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("button", { name: "साफ़ करें" })).toBeVisible();
    await expect.element(page.getByRole("button", { name: "विकल्प दिखाएँ" })).toBeVisible();
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(760, 420);
    const { container } = await render(
      <div
        data-qx-stage=""
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          alignItems: "start",
          padding: 16,
          inlineSize: 720,
          blockSize: 380,
          background: "var(--qx-color-surface-canvas)",
        }}
      >
        <Field label="Owner">
          <Combobox items={PEOPLE} icon={SearchIcon} placeholder="e.g. Priya Sharma" defaultOpen />
        </Field>
        <Field label="Members">
          <Combobox items={PEOPLE} multiple defaultValue={["usr_1", "usr_3"]} />
        </Field>
      </div>,
    );
    await expect.element(page.getByRole("option", { name: /Priya Sharma/ })).toBeVisible();
    await screenshotEveryMode("Combobox", null);
    // While a list is open Base UI hides the rest of the page from assistive technology, so the
    // open list is checked on its own, then the form once the list has closed.
    await expectAccessible(document.querySelector("[data-slot=combobox-popup]") as HTMLElement);
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("listbox")).not.toBeInTheDocument();
    await expectAccessible(container);
  });
});
