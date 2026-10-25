import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Button } from "../button/button";
import { TextField } from "../text-field/text-field";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  type DialogProps,
  DialogTrigger,
} from "./dialog";

function RenameDialog(props: Omit<DialogProps, "children">) {
  return (
    <Dialog {...props}>
      <DialogTrigger render={<Button variant="soft">Rename</Button>} />
      <DialogContent title="Rename invoice" description="Customers see this name.">
        <DialogBody>
          <TextField label="Name" defaultValue="INV-2026-0042" />
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Cancel</Button>} />
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RevokeDialog(props: Omit<DialogProps, "children">) {
  return (
    <Dialog intent="danger" {...props}>
      <DialogTrigger render={<Button tone="danger">Revoke key</Button>} />
      <DialogContent
        title="Revoke this API key?"
        description="Apps using it stop working at once."
        size="sm"
      >
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Cancel</Button>} />
          <DialogClose render={<Button tone="danger">Revoke key</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("is labelled and described, and puts focus on the first field", async () => {
    await render(<RenameDialog />);
    await page.getByRole("button", { name: "Rename" }).click();
    const dialog = page.getByRole("dialog", { name: "Rename invoice" });
    await expect.element(dialog).toHaveAccessibleDescription("Customers see this name.");
    await expect.element(page.getByRole("textbox", { name: "Name" })).toHaveFocus();
  });

  it("closes on Escape and returns focus to its trigger", async () => {
    await render(<RenameDialog />);
    const trigger = page.getByRole("button", { name: "Rename" });
    await trigger.click();
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  it("puts its close button last in the focus order, at the top end", async () => {
    await render(<RenameDialog defaultOpen />);
    const popup = document.querySelector("[data-slot=dialog-popup]") as HTMLElement;
    expect(popup.lastElementChild?.getAttribute("data-slot")).toBe("dialog-close");
    const close = page.getByRole("button", { name: "Close" }).element().getBoundingClientRect();
    const box = popup.getBoundingClientRect();
    // 12px from the end edge, and 12px under the 3px intent line.
    expect(box.right - close.right).toBe(12);
    expect(close.top - box.top).toBe(15);
  });

  it("danger: an alert dialog that only its actions close, focused on Cancel", async () => {
    await page.viewport(800, 600);
    await render(<RevokeDialog />);
    await page.getByRole("button", { name: "Revoke key" }).click();
    const dialog = page.getByRole("alertdialog", { name: "Revoke this API key?" });
    await expect.element(dialog).toBeVisible();
    await expect.element(page.getByRole("button", { name: "Cancel" })).toHaveFocus();
    expect(document.querySelector("[data-slot=dialog-close]")).toBeNull();
    await userEvent.keyboard("{Escape}");
    await expect.element(dialog).toBeVisible();
    const popup = dialog.element();
    expect(getComputedStyle(popup).borderTopColor).toBe(tokenColor("--qx-color-border-danger"));
    expect(getComputedStyle(popup).borderTopWidth).toBe("3px");
    expect(popup.getBoundingClientRect().width).toBe(400);
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect.element(dialog).not.toBeInTheDocument();
  });

  it("is accessible and looks right in both schemes", async () => {
    await page.viewport(720, 420);
    await render(<RenameDialog defaultOpen />);
    await expect.element(page.getByRole("dialog")).toBeVisible();
    await expectAccessible(document.body);
    await screenshotSchemes("Dialog", null);
  });

  it("looks right as a destructive confirmation", async () => {
    await page.viewport(560, 320);
    await render(<RevokeDialog defaultOpen />);
    await expect.element(page.getByRole("alertdialog")).toBeVisible();
    await expectAccessible(document.body);
    await screenshotSchemes("Dialog · danger", null);
  });
});
