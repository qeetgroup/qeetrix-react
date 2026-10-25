import { CheckIcon } from "@qeetrix/icons/icons/check";
import { MinusIcon } from "@qeetrix/icons/icons/minus";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Inline } from "../inline/inline";
import { Stack } from "../stack/stack";
import { Checkbox, CheckboxGroup } from "./checkbox";

describe("Checkbox", () => {
  it("toggles from its label and from Space, and reports the new state", async () => {
    const onCheckedChange = vi.fn();
    await render(<Checkbox label="Keep me signed in" onCheckedChange={onCheckedChange} />);
    const checkbox = page.getByRole("checkbox", { name: "Keep me signed in" });
    await page.getByText("Keep me signed in").click();
    await expect.element(checkbox).toBeChecked();
    expect(onCheckedChange).toHaveBeenLastCalledWith(true, expect.anything());
    await userEvent.keyboard(" ");
    await expect.element(checkbox).not.toBeChecked();
  });

  it("is described by its description, and its row is a 24px target", async () => {
    const { container } = await render(
      <Checkbox label="GST" description="Adds 18% to every invoice." />,
    );
    await expect
      .element(page.getByRole("checkbox", { name: "GST" }))
      .toHaveAccessibleDescription("Adds 18% to every invoice.");
    const label = container.querySelector("[data-slot=checkbox-label]") as HTMLElement;
    expect(label.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
  });

  it("renders the control alone when named by aria-label, and shows mixed", async () => {
    const { container } = await render(
      <>
        <Checkbox aria-label="Select all rows" indeterminate />
        <MinusIcon shape="sharp" size={12} strokeWidth={3} aria-hidden data-reference="" />
      </>,
    );
    const checkbox = page.getByRole("checkbox", { name: "Select all rows" });
    await expect.element(checkbox).toHaveAttribute("aria-checked", "mixed");
    expect(container.querySelector("[data-slot=checkbox]")).toBeNull();
    expect(container.querySelector("[data-slot=checkbox-mark] svg")?.innerHTML).toBe(
      container.querySelector("svg[data-reference]")?.innerHTML,
    );
  });

  it("shows the Ember focus frame 2px outside the box", async () => {
    await render(<Checkbox label="Email" />);
    await userEvent.keyboard("{Tab}");
    const style = getComputedStyle(page.getByRole("checkbox", { name: "Email" }).element());
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineOffset).toBe("2px");
  });
});

describe("CheckboxGroup", () => {
  it("names the group by its question and reports the checked values", async () => {
    const onValueChange = vi.fn();
    await render(
      <CheckboxGroup label="Notify me by" defaultValue={["email"]} onValueChange={onValueChange}>
        <Checkbox value="email" label="Email" />
        <Checkbox value="sms" label="SMS" />
      </CheckboxGroup>,
    );
    await expect.element(page.getByRole("group", { name: "Notify me by" })).toBeVisible();
    await page.getByText("SMS").click();
    expect(onValueChange).toHaveBeenLastCalledWith(["email", "sms"], expect.anything());
  });

  it("checks every option from a parent checkbox", async () => {
    await render(
      <CheckboxGroup label="Columns" allValues={["name", "role"]} defaultValue={[]}>
        <Checkbox parent label="All columns" />
        <Checkbox value="name" label="Name" />
        <Checkbox value="role" label="Role" />
      </CheckboxGroup>,
    );
    await page.getByText("All columns").click();
    await expect.element(page.getByRole("checkbox", { name: "Name" })).toBeChecked();
    await expect.element(page.getByRole("checkbox", { name: "Role" })).toBeChecked();
  });

  it("draws a dash, not a tick, on a parent checkbox while the group is partly checked", async () => {
    const { container } = await render(
      <>
        <CheckboxGroup label="Columns" allValues={["name", "role"]} defaultValue={["name"]}>
          <Checkbox parent label="All columns" />
          <Checkbox value="name" label="Name" />
          <Checkbox value="role" label="Role" />
        </CheckboxGroup>
        <span data-reference="dash">
          <MinusIcon shape="sharp" size={12} strokeWidth={3} aria-hidden />
        </span>
        <span data-reference="tick">
          <CheckIcon shape="sharp" size={12} strokeWidth={3} aria-hidden />
        </span>
      </>,
    );
    const drawing = (selector: string) => container.querySelector(`${selector} svg`)?.innerHTML;
    const parent = page.getByRole("checkbox", { name: "All columns" });
    const markOf = (name: string) =>
      page.getByRole("checkbox", { name }).element().querySelector("[data-slot=checkbox-mark] svg")
        ?.innerHTML;
    await expect.element(parent).toHaveAttribute("aria-checked", "mixed");
    expect(markOf("All columns")).toBe(drawing("[data-reference=dash]"));
    expect(markOf("Name")).toBe(drawing("[data-reference=tick]"));
    // Checking the rest makes the parent checked: the dash becomes a tick.
    await page.getByText("Role").click();
    await expect.element(parent).toHaveAttribute("aria-checked", "true");
    expect(markOf("All columns")).toBe(drawing("[data-reference=tick]"));
  });

  it("shows its error and marks the options invalid", async () => {
    const { container } = await render(
      <CheckboxGroup label="Notify me by" error="Choose at least one.">
        <Checkbox value="email" label="Email" />
      </CheckboxGroup>,
    );
    expect(container.querySelector("[data-slot=field-error]")?.textContent).toBe(
      "Choose at least one.",
    );
    await expect
      .element(page.getByRole("checkbox", { name: "Email" }))
      .toHaveAttribute("data-invalid", "");
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <Stack gap="lg">
          <CheckboxGroup label="Notify me by" defaultValue={["email"]} orientation="horizontal">
            <Checkbox value="email" label="Email" />
            <Checkbox value="sms" label="SMS" />
            <Checkbox value="whatsapp" label="WhatsApp" disabled />
          </CheckboxGroup>
          <Stack gap="xs">
            <Checkbox label="GST" description="Adds 18% to every invoice." defaultChecked />
            <Checkbox label="Some rows" indeterminate />
            <Checkbox label="Locked on" disabled defaultChecked />
          </Stack>
          <Inline gap="sm">
            <Checkbox aria-label="Select row" />
            <Checkbox aria-label="Select row 2" defaultChecked />
          </Inline>
        </Stack>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("Checkbox");
  });
});
