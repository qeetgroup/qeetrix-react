import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { Field } from "../../field/field";
import { CopyButton } from "../copy-button/copy-button";
import { PasswordInput } from "./password-input";

const field = () => page.getByLabelText("Password").element() as HTMLInputElement;
const toggle = () => page.getByRole("button", { name: "Show password" });

describe("PasswordInput", () => {
  it("starts hidden, with password-manager hints and no spelling tools", async () => {
    await render(
      <Field label="Password">
        <PasswordInput />
      </Field>,
    );
    expect(field().type).toBe("password");
    expect(field().getAttribute("autocomplete")).toBe("current-password");
    expect(field().getAttribute("spellcheck")).toBe("false");
    expect(field().getAttribute("autocapitalize")).toBe("none");
    expect(field().maxLength).toBe(-1);
  });

  it("suggests a new password when creating one", async () => {
    await render(
      <Field label="Password">
        <PasswordInput autoComplete="new-password" />
      </Field>,
    );
    expect(field().getAttribute("autocomplete")).toBe("new-password");
  });

  it("shows and hides from a pressed toggle, announces it, and keeps the caret", async () => {
    const onVisibleChange = vi.fn();
    await render(
      <Field label="Password">
        <PasswordInput defaultValue="correct horse" onVisibleChange={onVisibleChange} />
      </Field>,
    );
    field().focus();
    field().setSelectionRange(3, 3);
    await toggle().click();
    expect(field().type).toBe("text");
    await expect.element(toggle()).toHaveAttribute("aria-pressed", "true");
    await expect.element(toggle()).toHaveFocus();
    await expect.element(page.getByText("Password shown")).toBeInTheDocument();
    expect(onVisibleChange).toHaveBeenLastCalledWith(true);
    await expect.poll(() => field().selectionStart).toBe(3);
    await toggle().click();
    expect(field().type).toBe("password");
    await expect.element(page.getByText("Password hidden")).toBeInTheDocument();
  });

  it("hides again when its form is submitted", async () => {
    await render(
      <form onSubmit={(event) => event.preventDefault()}>
        <Field label="Password">
          <PasswordInput defaultVisible defaultValue="correct horse" />
        </Field>
        <button type="submit">Sign in</button>
      </form>,
    );
    expect(field().type).toBe("text");
    await page.getByRole("button", { name: "Sign in" }).click();
    expect(field().type).toBe("password");
    await expect.element(toggle()).toHaveAttribute("aria-pressed", "false");
  });

  it("warns while Caps Lock is on, and stops when it's off", async () => {
    await render(
      <Field label="Password">
        <PasswordInput />
      </Field>,
    );
    field().focus();
    const key = (capsLock: boolean) =>
      field().dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "A",
          bubbles: true,
          modifierCapsLock: capsLock,
        } as KeyboardEventInit),
      );
    key(true);
    await expect.element(page.getByText("Caps Lock is on")).toBeVisible();
    key(false);
    await expect.element(page.getByText("Caps Lock is on")).not.toBeInTheDocument();
  });

  it("disables its toggle with the field", async () => {
    await render(
      <Field label="Password" disabled>
        <PasswordInput disabled />
      </Field>,
    );
    await expect.element(toggle()).toHaveAttribute("aria-disabled", "true");
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <Field label="Password" style={{ inlineSize: 280 }}>
          <PasswordInput defaultValue="correct horse battery" />
        </Field>
        <Field label="Client secret" style={{ inlineSize: 360 }}>
          <PasswordInput
            readOnly
            autoComplete="off"
            defaultValue="qs_live_9f2c7d1e4b8a"
            defaultVisible
            endAdornment={
              <CopyButton value="qs_live_9f2c7d1e4b8a" label="Copy client secret" size="sm" />
            }
          />
        </Field>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("PasswordInput", "[data-qx-stage]");
  });
});
