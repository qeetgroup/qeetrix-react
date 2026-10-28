import { useState } from "react";
import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { tokenColor } from "../../../tests/support/color";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { Field } from "../../field/field";
import { type EmailEntryState, MultiEmailField } from "./multi-email-field";

const directory: Record<string, EmailEntryState> = {
  "asha@qeet.in": { tone: "skipped", note: "Already a member" },
  "ravi@qeet.in": { tone: "info", note: "Invitation sent again" },
};
const check = (email: string): EmailEntryState =>
  directory[email] ?? { tone: "success", note: "New invitation" };

function Invite({ max, onValue }: { max?: number; onValue?: (value: string[]) => void }) {
  const [value, setValue] = useState<string[]>([]);
  return (
    <Field label="Email addresses" description="Separate them with commas, spaces or new lines.">
      <MultiEmailField
        value={value}
        onValueChange={(next) => {
          setValue(next);
          onValue?.(next);
        }}
        check={check}
        max={max}
      />
    </Field>
  );
}

const entries = () =>
  page
    .getByRole("list", { name: "Addresses" })
    .getByRole("listitem")
    .elements()
    .map((item) => item.textContent);

describe("MultiEmailField", () => {
  it("is labelled by its Field and turns each address typed into a row with its state", async () => {
    await render(<Invite />);
    const box = page.getByRole("textbox", { name: "Email addresses" });
    await userEvent.click(box);
    await userEvent.keyboard("meera@qeet.in,asha@qeet.in ravi@qeet.in{Enter}");
    expect(entries()).toEqual([
      "meera@qeet.in, New invitation",
      "asha@qeet.in, Already a member",
      "ravi@qeet.in, Invitation sent again",
    ]);
    await expect.element(box).toHaveValue("");
    const asha = page.getByText("asha@qeet.in", { exact: true }).element();
    expect(getComputedStyle(asha).textDecorationLine).toBe("line-through");
  });

  // Firefox ignores the data in a scripted paste event.
  const canScriptPaste = (() => {
    const data = new DataTransfer();
    data.setData("text/plain", "1");
    return (
      new ClipboardEvent("paste", { clipboardData: data }).clipboardData?.getData("text") === "1"
    );
  })();

  it.runIf(canScriptPaste)(
    "splits a pasted column, skips repeats and says when an address isn't one",
    async () => {
      await render(<Invite />);
      const box = page.getByRole("textbox", { name: "Email addresses" });
      await userEvent.click(box);
      const data = new DataTransfer();
      data.setData("text/plain", "meera@qeet.in\nnot-an-email\nMEERA@qeet.in\nkiran@qeet.in");
      box
        .element()
        .dispatchEvent(
          new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }),
        );
      await expect.poll(entries).toHaveLength(3);
      expect(entries()).toEqual([
        "meera@qeet.in, New invitation",
        "not-an-email, Not an email address",
        "kiran@qeet.in, New invitation",
      ]);
      const note = document.querySelector(
        "[data-tone=danger] .qx-multi-email-field-note",
      ) as Element;
      expect(getComputedStyle(note).color).toBe(tokenColor("--qx-color-text-danger"));
      await expect
        .element(page.getByText("Added meera@qeet.in, not-an-email, kiran@qeet.in"))
        .toBeInTheDocument();
    },
  );

  it("removes the last address on Backspace in the empty box, and any with its own button", async () => {
    await render(<Invite />);
    const box = page.getByRole("textbox", { name: "Email addresses" });
    await userEvent.click(box);
    await userEvent.keyboard("a@qeet.in b@qeet.in c@qeet.in ");
    await userEvent.keyboard("{Backspace}");
    expect(entries()).toHaveLength(2);
    await userEvent.click(page.getByRole("button", { name: "Remove a@qeet.in" }));
    expect(entries()).toEqual(["b@qeet.in, New invitation"]);
    await expect.element(box).toHaveFocus();
    await expect.element(page.getByText("Removed a@qeet.in")).toBeInTheDocument();
  });

  it("takes up to max, keeps the rest in the box and says so", async () => {
    let last: string[] = [];
    await render(<Invite max={2} onValue={(value) => (last = value)} />);
    const box = page.getByRole("textbox", { name: "Email addresses" });
    await userEvent.click(box);
    await userEvent.keyboard("a@qeet.in, b@qeet.in, c@qeet.in{Enter}");
    expect(last).toEqual(["a@qeet.in", "b@qeet.in"]);
    await expect.element(box).toHaveValue("c@qeet.in");
    await expect
      .element(page.getByText("Up to 2 at a time. The rest are still in the box."))
      .toBeVisible();
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <div style={{ inlineSize: 420 }}>
          <Field label="Email addresses">
            <MultiEmailField
              defaultValue={["meera@qeet.in", "asha@qeet.in", "ravi@qeet.in", "nope"]}
              check={check}
            />
          </Field>
        </div>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotSchemes("MultiEmailField");
  });
});
