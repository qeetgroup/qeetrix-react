import { MailIcon } from "@qeetrix/icons/icons/mail";
import { SearchIcon } from "@qeetrix/icons/icons/search";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { PasswordInput } from "../experimental/password-input/password-input";
import { Field } from "../field/field";
import { Stack } from "../stack/stack";
import { TextField } from "../text-field/text-field";
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

describe("Input size lg", () => {
  /** A role's computed font, from a probe that sets the role's `font`. */
  const roleFont = (role: string) => {
    const probe = document.createElement("span");
    probe.style.font = `var(--qx-typography-${role})`;
    document.body.append(probe);
    const { fontSize, fontWeight } = getComputedStyle(probe);
    probe.remove();
    return { fontSize, fontWeight };
  };
  const fontSize = (role: string) => roleFont(role).fontSize;

  it("is OTPInput's lg height in every density: 48, 56 and 60px; md stays the shared height", async () => {
    const { container } = await render(
      <>
        <Input aria-label="Phone number" size="lg" />
        <Input aria-label="Name" />
      </>,
    );
    const [large, medium] = [...container.querySelectorAll<HTMLElement>("[data-slot=input]")];
    const heights: Record<string, number[]> = {};
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      heights[density] = [large, medium].map((each) => each?.getBoundingClientRect().height ?? 0);
    }
    delete html.dataset.qxDensity;
    expect(heights).toEqual({ compact: [48, 32], default: [56, 40], comfortable: [60, 44] });
    expect(medium?.dataset.size).toBe("md");
  });

  it("writes the value and its affix at title.lg's size in regular weight with tabular figures, the placeholder at body size, in every density", async () => {
    const { container } = await render(
      <Input aria-label="Phone number" size="lg" startAdornment="+91" placeholder="98765 43210" />,
    );
    const control = container.querySelector("input") as HTMLInputElement;
    const affix = container.querySelector("[data-slot=input-start]") as HTMLElement;
    const middle = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2;
    };
    // title.lg's size (20px) but not its semibold: the typed value reads as text, not a heading.
    expect(roleFont("title-lg")).toEqual({ fontSize: "20px", fontWeight: "600" });
    expect(roleFont("body-md").fontWeight).toBe("400");
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      for (const part of [control, affix]) {
        const style = getComputedStyle(part);
        expect([style.fontSize, style.fontWeight], density).toEqual(["20px", "400"]);
      }
      expect(getComputedStyle(control).fontVariantNumeric, density).toBe("tabular-nums");
      const placeholder = getComputedStyle(control, "::placeholder");
      expect(placeholder.fontSize, density).toBe(fontSize("body-md"));
      expect(placeholder.fontWeight, density).toBe("400");
      // The affix reads with the value: the same size, on the same middle line.
      expect(Math.abs(middle(affix) - middle(control)), density).toBeLessThanOrEqual(1);
    }
    delete html.dataset.qxDensity;
  });

  it("is TextField's and PasswordInput's too, the label and help text on the box's edges", async () => {
    const { container } = await render(
      <Stack gap="md" style={{ inlineSize: 320 }}>
        <TextField
          label="Phone number"
          description="We'll text a code to it."
          size="lg"
          startAdornment="+91"
        />
        <PasswordInput aria-label="Password" size="lg" />
      </Stack>,
    );
    const boxes = [...container.querySelectorAll<HTMLElement>("[data-slot=input]")];
    expect(boxes.map((each) => each.dataset.size)).toEqual(["lg", "lg"]);
    expect(boxes.map((each) => each.getBoundingClientRect().height)).toEqual([56, 56]);
    const field = container.querySelector("[data-slot=text-field]") as HTMLElement;
    const left = (el: Element | null) => el?.getBoundingClientRect().left;
    expect(left(field.querySelector("label"))).toBe(left(boxes[0] as HTMLElement));
    expect(left(page.getByText("We'll text a code to it.").element())).toBe(
      left(boxes[0] as HTMLElement),
    );
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
          <Input
            aria-label="Phone number"
            size="lg"
            startAdornment="+91"
            defaultValue="98765 43210"
          />
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
