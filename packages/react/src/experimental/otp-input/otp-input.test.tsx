import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { Field } from "../../field/field";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { OTPInput } from "./otp-input";

const slots = () => [...document.querySelectorAll<HTMLInputElement>("[data-slot=otp-input-slot]")];

describe("OTPInput", () => {
  // First in the file: Base UI warns once per page, so a later test could hide the warning.
  it("names a standalone code's group and every slot, with no Base UI warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await render(
      <>
        <OTPInput aria-label="Verification code" />
        <span id="recovery-label">Recovery code</span>
        <OTPInput aria-labelledby="recovery-label" length={4} />
      </>,
    );
    for (const [name, length] of [
      ["Verification code", 6],
      ["Recovery code", 4],
    ] as const) {
      const group = page.getByRole("group", { name, exact: true });
      await expect.element(group).toBeVisible();
      for (let index = 1; index <= length; index++) {
        const slotName = index === 1 ? name : `Character ${index} of ${length}`;
        await expect
          .element(group.getByRole("textbox", { name: slotName, exact: true }))
          .toBeInTheDocument();
      }
    }
    expect(warn.mock.calls.flat().join("\n")).not.toContain("ignores `aria-label`");
    warn.mockRestore();
  });

  it("has six slots: the first takes the field's label, the rest say where they are", async () => {
    await render(
      <Field
        label="Verification code"
        description="Enter the 6-digit code from your authenticator app."
      >
        <OTPInput />
      </Field>,
    );
    expect(slots()).toHaveLength(6);
    await expect.element(page.getByRole("textbox", { name: "Verification code" })).toBeVisible();
    await expect.element(page.getByRole("textbox", { name: "Character 2 of 6" })).toBeVisible();
    expect(slots()[0]?.getAttribute("autocomplete")).toBe("one-time-code");
    expect(slots()[0]?.inputMode).toBe("numeric");
  });

  it("moves on as you type, takes digits only, and reports the complete code", async () => {
    const onValueComplete = vi.fn();
    await render(<OTPInput aria-label="Code" onValueComplete={onValueComplete} />);
    slots()[0]?.focus();
    await userEvent.keyboard("12a3456");
    await expect.poll(() => onValueComplete.mock.calls[0]?.[0]).toBe("123456");
    expect(
      slots()
        .map((slot) => slot.value)
        .join(""),
    ).toBe("123456");
  });

  // Firefox ignores the data in a scripted paste event; there the paste path is Base UI's own.
  const canScriptPaste = (() => {
    const data = new DataTransfer();
    data.setData("text/plain", "1");
    return (
      new ClipboardEvent("paste", { clipboardData: data }).clipboardData?.getData("text/plain") ===
      "1"
    );
  })();

  it.runIf(canScriptPaste)("fills every slot from one paste", async () => {
    await render(<OTPInput aria-label="Code" />);
    const data = new DataTransfer();
    data.setData("text/plain", "654 321");
    slots()[0]?.focus();
    slots()[0]?.dispatchEvent(
      new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }),
    );
    await expect
      .poll(() =>
        slots()
          .map((slot) => slot.value)
          .join(""),
      )
      .toBe("654321");
  });

  it("spans its container like every field, as tall as an Input at md", async () => {
    await page.viewport(800, 300);
    const { container } = await render(
      <div style={{ inlineSize: 400 }}>
        <OTPInput aria-label="Code" />
      </div>,
    );
    const root = container.querySelector("[data-slot=otp-input]") as HTMLElement;
    expect(root.getBoundingClientRect().width).toBe(400);
    const last = slots()[5] as HTMLElement;
    expect(last.getBoundingClientRect().right).toBe(root.getBoundingClientRect().right);
    const probe = document.createElement("div");
    probe.style.blockSize = "var(--qx-size-control-lg)";
    root.append(probe);
    expect(last.getBoundingClientRect().height).toBe(probe.getBoundingClientRect().height);
    probe.remove();
  });

  it("shrinks its slots to fit a narrow column: a 10-character recovery code in 400px", async () => {
    await page.viewport(800, 300);
    const { container } = await render(
      <div style={{ inlineSize: 400 }}>
        <OTPInput
          aria-label="Recovery code"
          length={10}
          groups={[5, 5]}
          validationType="alphanumeric"
        />
      </div>,
    );
    const column = container.firstElementChild as HTMLElement;
    const root = container.querySelector("[data-slot=otp-input]") as HTMLElement;
    for (const density of ["compact", "default", "comfortable"]) {
      document.documentElement.dataset.qxDensity = density;
      const edge = column.getBoundingClientRect();
      const widths = slots().map((slot) => slot.getBoundingClientRect().width);
      // Before: 10 slots of size.control.lg ran 88px (128px at comfortable) past the column.
      const last = (slots()[9] as HTMLElement).getBoundingClientRect();
      expect(Math.abs(root.getBoundingClientRect().right - edge.right), density).toBeLessThan(0.5);
      expect(Math.abs(last.right - edge.right), density).toBeLessThan(0.5);
      expect(root.scrollWidth, density).toBe(root.clientWidth);
      // The slots share the width equally and stay at least a 24px target.
      expect(Math.max(...widths) - Math.min(...widths), density).toBeLessThan(0.5);
      expect(Math.min(...widths), density).toBeGreaterThanOrEqual(24);
    }
    delete document.documentElement.dataset.qxDensity;
  });

  it("keeps Qeet Sans's geometry and tabular figures at lg", async () => {
    await render(<OTPInput aria-label="Code" size="lg" />);
    const style = getComputedStyle(slots()[0] as HTMLElement);
    expect(style.fontVariationSettings).toMatch(/"GEOM"/);
    expect(style.fontVariantNumeric).toBe("tabular-nums");
  });

  it("groups the slots when asked", async () => {
    const { container } = await render(<OTPInput aria-label="Code" groups={[3, 3]} />);
    expect(container.querySelectorAll(".qx-otp-input-separator")).toHaveLength(1);
    const [third, separator] = [slots()[2], container.querySelector(".qx-otp-input-separator")];
    expect(third?.nextElementSibling).toBe(separator);
  });

  it("speaks Hindi through QeetrixProvider", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <OTPInput aria-label="सत्यापन कोड" length={4} />
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("textbox", { name: "4 में से अक्षर 2" })).toBeVisible();
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <Field label="Verification code">
          <OTPInput defaultValue="4817" />
        </Field>
        <Field label="Recovery code">
          <OTPInput size="lg" groups={[3, 3]} validationType="alphanumeric" />
        </Field>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("OTPInput", "[data-qx-stage]");
  });
});
