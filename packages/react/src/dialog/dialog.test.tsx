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
  type DialogSize,
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

/** A long read with nothing focusable in its body: the body itself must take focus to scroll. */
function TermsDialog(props: Omit<DialogProps, "children">) {
  return (
    <Dialog defaultOpen {...props}>
      <DialogContent title="Terms of service" size="sm">
        <DialogBody>
          {Array.from({ length: 24 }, (_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list
            <p key={index}>Clause {index + 1}. Invoices are due within 30 days of issue.</p>
          ))}
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Decline</Button>} />
          <DialogClose render={<Button>Accept</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SizedDialog({ size }: { size: DialogSize }) {
  return (
    <Dialog defaultOpen>
      <DialogContent title="Import customers" description="Map each column." size={size}>
        <DialogBody>
          <TextField label="File name" defaultValue="customers-2026.csv" />
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Cancel</Button>} />
          <Button>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const body = () => document.querySelector("[data-slot=dialog-body]") as HTMLElement;
const popupBox = () =>
  (document.querySelector("[data-slot=dialog-popup]") as HTMLElement).getBoundingClientRect();

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

  it("opened from the keyboard with nothing to fill in, closes on the first Escape", async () => {
    await render(
      <Dialog>
        <DialogTrigger render={<Button variant="soft">Keys</Button>} />
        <DialogContent title="Keys" size="sm">
          <DialogBody>Press ? to see this list.</DialogBody>
        </DialogContent>
      </Dialog>,
    );
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");
    // Focus lands on Close, from the keyboard; it shows no tooltip to catch the Escape.
    await expect.element(page.getByRole("button", { name: "Close" })).toHaveFocus();
    await expect.element(page.getByRole("tooltip")).not.toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
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

  it("draws its close button in the neutral tone, as a utility icon", async () => {
    await render(<RenameDialog defaultOpen />);
    const close = page.getByRole("button", { name: "Close" });
    await expect.element(close).toHaveAttribute("data-tone", "neutral");
    expect(getComputedStyle(close.element()).color).toBe(tokenColor("--qx-color-text-subtle"));
  });

  it("a scrolling body with nothing focusable takes focus, without becoming the first stop", async () => {
    await page.viewport(720, 420);
    await render(<TermsDialog intent="danger" />);
    await expect.poll(() => body().getAttribute("tabindex")).toBe("0");
    // Still opens on the least destructive action.
    await expect.element(page.getByRole("button", { name: "Decline" })).toHaveFocus();
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    await expect.poll(() => document.activeElement).toBe(body());
    expect(getComputedStyle(body()).outlineWidth).toBe("2px");
    expect(getComputedStyle(body()).outlineColor).toBe(tokenColor("--qx-color-border-focus"));
    await userEvent.keyboard("{PageDown}");
    await expect.poll(() => body().scrollTop).toBeGreaterThan(0);
    await expectAccessible(document.body);
  });

  it("a body that fits, or holds a field, stays out of the tab order", async () => {
    await page.viewport(720, 420);
    const { rerender } = await render(<RenameDialog defaultOpen />);
    await expect.element(page.getByRole("dialog")).toBeVisible();
    expect(body().hasAttribute("tabindex")).toBe(false);
    await rerender(
      <Dialog defaultOpen>
        <DialogContent title="Rename invoice">
          <DialogBody>
            <div style={{ blockSize: 800 }} />
            <TextField label="Name" defaultValue="INV-2026-0042" />
          </DialogBody>
        </DialogContent>
      </Dialog>,
    );
    await expect.poll(() => body().scrollHeight > body().clientHeight).toBe(true);
    expect(body().hasAttribute("tabindex")).toBe(false);
    await expectAccessible(document.body);
  });

  it("xl is 1120px wide, never wider than the viewport less 48px", async () => {
    await page.viewport(1400, 640);
    await render(<SizedDialog size="xl" />);
    await expect.poll(() => popupBox().width).toBe(1120);
    await page.viewport(900, 640);
    await expect.poll(() => popupBox().width).toBe(852);
    await expectAccessible(document.body);
  });

  it("fullscreen fills the viewport, square, under its intent line", async () => {
    await page.viewport(720, 420);
    await render(<SizedDialog size="fullscreen" />);
    await expect.poll(() => popupBox().height).toBe(420);
    const box = popupBox();
    expect([box.left, box.top, box.width]).toEqual([0, 0, 720]);
    const popup = document.querySelector("[data-slot=dialog-popup]") as HTMLElement;
    expect(getComputedStyle(popup).borderRadius).toBe("0px");
    expect(getComputedStyle(popup).borderTopWidth).toBe("3px");
    await expectAccessible(document.body);
    await screenshotSchemes("Dialog · fullscreen", null);
  });

  it("looks right at xl", async () => {
    await page.viewport(1280, 480);
    await render(<SizedDialog size="xl" />);
    await expect.element(page.getByRole("dialog")).toBeVisible();
    await screenshotSchemes("Dialog · xl", null);
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
