import { useState } from "react";
import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { Field } from "../../field/field";
import { CodeField } from "./code-field";

const REQUEST = '{\n  "subject": "user:asha",\n  "action": "read"\n}';

function Request({ error }: { error?: string }) {
  const [value, setValue] = useState(REQUEST);
  return (
    <div style={{ inlineSize: 420 }}>
      <Field label="Request" error={error} invalid={error !== undefined}>
        <CodeField value={value} onValueChange={setValue} language="json" />
      </Field>
    </div>
  );
}

const box = () => page.getByRole("textbox", { name: "Request" });

describe("CodeField", () => {
  it("is labelled by its Field, numbers its lines and colours the code", async () => {
    const { container } = await render(<Request />);
    await expect.element(box()).toHaveValue(REQUEST);
    const gutter = container.querySelector(".qx-code-field-gutter") as HTMLElement;
    expect(gutter.textContent).toBe("1234");
    expect(gutter.getAttribute("aria-hidden")).toBe("true");
    const key = container.querySelector('[data-token="keyword"]') as HTMLElement;
    expect(key.textContent).toBe('"subject"');
    expect(getComputedStyle(key).color).toBe(tokenColor("--qx-color-code-keyword"));
  });

  it("lays the typed text exactly over its coloured copy", async () => {
    const { container } = await render(<Request />);
    const field = box().element() as HTMLTextAreaElement;
    const lines = container.querySelectorAll(".qx-code-field-line");
    const highlight = container.querySelector(".qx-code-field-highlight") as HTMLElement;
    expect(Math.round(field.getBoundingClientRect().top)).toBe(
      Math.round(highlight.getBoundingClientRect().top),
    );
    const lineHeight = Number.parseFloat(getComputedStyle(field).lineHeight);
    expect(Math.round((lines[1] as HTMLElement).getBoundingClientRect().height)).toBe(
      Math.round(lineHeight),
    );
    expect(getComputedStyle(field).color).toBe("rgba(0, 0, 0, 0)");
  });

  it("indents with Tab and outdents with Shift+Tab; Escape, then Tab, leaves", async () => {
    await render(
      <>
        <Request />
        <button type="button">Run</button>
      </>,
    );
    const field = box().element() as HTMLTextAreaElement;
    await userEvent.click(box());
    field.setSelectionRange(field.value.length, field.value.length);
    await userEvent.keyboard("{Tab}");
    expect(field.value.endsWith("}  ")).toBe(true);
    await expect.element(box()).toHaveFocus();
    field.setSelectionRange(8, 8);
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(field.value.split("\n")[1]).toBe('"subject": "user:asha",');
    expect(field.selectionStart).toBe(6);
    await userEvent.keyboard("{Escape}{Tab}");
    await expect.element(page.getByRole("button", { name: "Run" })).toHaveFocus();
  });

  it("shows its Field's error with the danger frame", async () => {
    const { container } = await render(<Request error="This isn't valid JSON." />);
    await expect.element(box()).toHaveAccessibleDescription("This isn't valid JSON.");
    const frame = container.querySelector("[data-slot=code-field]") as HTMLElement;
    expect(getComputedStyle(frame).outlineColor).toBe(tokenColor("--qx-color-border-danger"));
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <Request />
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("CodeField");
  });
});
