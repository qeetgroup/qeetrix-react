import { MailIcon } from "@qeetrix/icons/icons/mail";
import { SearchIcon } from "@qeetrix/icons/icons/search";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Field } from "../field/field";
import { Stack } from "../stack/stack";
import { Input, Textarea } from "./input";

const html = document.documentElement;
const box = (container: HTMLElement) => container.querySelector("[data-slot=input]") as HTMLElement;

describe("Input", () => {
  it("follows the density: 32, 40 and 44px", async () => {
    const { container } = await render(<Input aria-label="Amount" />);
    const heights: Record<string, number> = {};
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      heights[density] = box(container).getBoundingClientRect().height;
    }
    delete html.dataset.qxDensity;
    expect(heights).toEqual({ compact: 32, default: 40, comfortable: 44 });
  });

  it("reports each change with the new value", async () => {
    const onValueChange = vi.fn();
    await render(<Input aria-label="Company" onValueChange={onValueChange} />);
    await userEvent.type(page.getByRole("textbox", { name: "Company" }), "Acme");
    expect(onValueChange).toHaveBeenLastCalledWith("Acme", expect.anything());
  });

  it("frames the box in Ember on any focus, and in red when invalid", async () => {
    const { container } = await render(
      <>
        <Input aria-label="GSTIN" />
        <Field label="PAN" error="PAN has 10 characters.">
          <Input />
        </Field>
      </>,
    );
    const [gstin, pan] = [...container.querySelectorAll("[data-slot=input]")] as HTMLElement[];
    expect(getComputedStyle(pan as HTMLElement).outlineColor).toBe(
      tokenColor("--qx-color-border-danger"),
    );
    await page.getByRole("textbox", { name: "GSTIN" }).click();
    const style = getComputedStyle(gstin as HTMLElement);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineColor).toBe(tokenColor("--qx-color-border-focus"));
  });

  it("puts the icon and affixes around the value", async () => {
    const { container } = await render(
      <Input aria-label="Amount" icon={SearchIcon} startAdornment="₹" endAdornment=".00" />,
    );
    const order = [...box(container).children].map((el) => el.getAttribute("data-slot"));
    expect(order).toEqual(["input-icon", "input-start", "input-control", "input-end"]);
    expect(container.querySelector("[data-slot=input-icon]")?.getAttribute("stroke-linecap")).toBe(
      "square",
    );
  });

  it("drops the fill when read-only", async () => {
    const { container } = await render(<Input aria-label="Account ID" readOnly defaultValue="x" />);
    expect(getComputedStyle(box(container)).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  });
});

describe("Textarea", () => {
  it("starts at its rows and grows with its content up to maxRows", async () => {
    await render(<Textarea aria-label="Notes" rows={2} maxRows={4} />);
    const textarea = page.getByRole("textbox", { name: "Notes" });
    const height = () => textarea.element().getBoundingClientRect().height;
    // Two 20px lines plus the 10px padding above and below at the default density.
    expect(height()).toBe(60);
    await userEvent.type(textarea, "one{Enter}two{Enter}three");
    expect(height()).toBe(80);
    await userEvent.type(textarea, "{Enter}four{Enter}five{Enter}six");
    expect(height()).toBe(100);
  });

  it("is a labelled control inside a Field", async () => {
    await render(
      <Field label="Notes" description="Shown on the invoice.">
        <Textarea />
      </Field>,
    );
    await expect
      .element(page.getByRole("textbox", { name: "Notes" }))
      .toHaveAccessibleDescription("Shown on the invoice.");
  });
});

describe("Input and Textarea", () => {
  it("are accessible and look right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <Stack gap="md" style={{ inlineSize: 280 }}>
          <Input aria-label="Work email" icon={MailIcon} placeholder="e.g. priya@acme.in" />
          <Input aria-label="Amount" startAdornment="₹" defaultValue="1,24,500" />
          <Input aria-label="Account ID" readOnly defaultValue="acc_7f3k29" />
          <Input aria-label="Legacy code" disabled defaultValue="LGC-0042" />
          <Textarea aria-label="Notes" defaultValue="Net 30. Bank transfer to HDFC." />
        </Stack>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("Input");
  });
});
