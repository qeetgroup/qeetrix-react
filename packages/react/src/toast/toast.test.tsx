import axe from "axe-core";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { settled } from "../../tests/support/settled";
import { Button } from "../button/button";
import { type ToastApi, type ToastOptions, ToastProvider, useToast } from "./toast";

function Trigger({ options, label = "Show" }: { options: ToastOptions; label?: string }) {
  const toast = useToast();
  return <Button onClick={() => toast.add(options)}>{label}</Button>;
}

function Saver({ saving }: { saving: Promise<string> }) {
  const toast = useToast();
  return (
    <Button
      onClick={() =>
        toast.promise(saving, {
          loading: { title: "Saving…" },
          success: (name) => ({ title: `Saved ${name}` }),
          error: { title: "Couldn't save" },
        })
      }
    >
      Save
    </Button>
  );
}

const toasts = () => [...document.querySelectorAll("[data-slot=toast]")] as HTMLElement[];
const slot = (name: string, root: ParentNode = document) =>
  root.querySelector(`[data-slot=${name}]`) as HTMLElement;

/** Re-renders on every send (its own state, and the provider's toasts), noting what useToast gave. */
function Probe({ seen }: { seen: ToastApi[] }) {
  const toast = useToast();
  const [count, setCount] = useState(0);
  seen.push(toast);
  return (
    <Button
      onClick={() => {
        toast.add({ title: `Invoice ${count} sent` });
        setCount(count + 1);
      }}
    >
      Send
    </Button>
  );
}

function Pending({ saving, error }: { saving: Promise<string>; error?: ToastOptions }) {
  const toast = useToast();
  return (
    <Button
      onClick={() =>
        toast
          .promise(saving, {
            loading: { title: "Saving invoice…" },
            success: { title: "Invoice saved" },
            error: error ?? { title: "Couldn't save the invoice", description: "Try again." },
          })
          .catch(() => {})
      }
    >
      Save
    </Button>
  );
}

describe("Toast", () => {
  it("shows in the Notifications region with its tone", async () => {
    await render(
      <ToastProvider>
        <Trigger
          options={{ title: "Invoice sent", description: "To billing@acme.in", tone: "success" }}
        />
      </ToastProvider>,
    );
    await page.getByRole("button", { name: "Show" }).click();
    await expect.element(page.getByRole("region", { name: /Notifications/ })).toBeInTheDocument();
    await expect.element(page.getByText("Invoice sent")).toBeVisible();
    expect(toasts()[0]?.dataset.tone).toBe("success");
  });

  it("draws its icon at 16px, Alert's size, centred on the title line", async () => {
    await render(
      <ToastProvider>
        <Trigger options={{ title: "Passkey added", description: "On Priya's MacBook Pro" }} />
      </ToastProvider>,
    );
    await page.getByRole("button", { name: "Show" }).click();
    await expect.element(page.getByText("Passkey added")).toBeVisible();
    await settled();
    const toast = toasts()[0] as HTMLElement;
    const icon = slot("toast-icon", toast).getBoundingClientRect();
    const title = slot("toast-title", toast);
    const line = Number.parseFloat(getComputedStyle(title).lineHeight);
    expect([icon.width, icon.height]).toEqual([16, 16]);
    const titleTop = title.getBoundingClientRect().top;
    expect(Math.abs(icon.top + icon.height / 2 - (titleTop + line / 2))).toBeLessThanOrEqual(0.5);
  });

  it("closes after its timeout, except danger toasts", async () => {
    await render(
      <ToastProvider>
        <Trigger label="Info" options={{ title: "Saved", timeout: 300 }} />
        <Trigger
          label="Error"
          options={{ title: "Payment failed", tone: "danger", timeout: 300 }}
        />
      </ToastProvider>,
    );
    await page.getByRole("button", { name: "Info" }).click();
    await page.getByRole("button", { name: "Error" }).click();
    await expect.poll(() => toasts().length, { timeout: 3000 }).toBe(1);
    expect(toasts()[0]?.textContent).toContain("Payment failed");
  });

  it("runs its one action, and closes from its Dismiss button", async () => {
    const undo = vi.fn();
    await render(
      <ToastProvider>
        <Trigger options={{ title: "Invoice deleted", action: { label: "Undo", onClick: undo } }} />
      </ToastProvider>,
    );
    await page.getByRole("button", { name: "Show" }).click();
    await page.getByRole("button", { name: "Undo" }).click();
    expect(undo).toHaveBeenCalledOnce();
    await page.getByRole("button", { name: "Dismiss" }).click();
    await expect.poll(() => toasts().length).toBe(0);
  });

  it("follows a promise from loading to success", async () => {
    let resolve: (value: string) => void = () => {};
    const saving = new Promise<string>((r) => {
      resolve = r;
    });
    await render(
      <ToastProvider>
        <Saver saving={saving} />
      </ToastProvider>,
    );
    await page.getByRole("button", { name: "Save" }).click();
    await expect.element(page.getByText("Saving…")).toBeVisible();
    resolve("INV-0042");
    await expect.element(page.getByText("Saved INV-0042")).toBeVisible();
    expect(toasts()[0]?.dataset.tone).toBe("success");
  });

  it("a danger toast stays exposed, focusable and named, and is still announced assertively", async () => {
    await render(
      <ToastProvider>
        <Trigger
          label="Error"
          options={{ title: "Payment failed", description: "Card declined.", tone: "danger" }}
        />
      </ToastProvider>,
    );
    await page.getByRole("button", { name: "Error" }).click();
    await expect.poll(() => toasts().length).toBe(1);
    const toast = toasts()[0] as HTMLElement;
    // Base UI hid it with aria-hidden while it stayed focusable (axe aria-hidden-focus).
    expect(toast.hasAttribute("aria-hidden")).toBe(false);
    expect(toast.getAttribute("tabindex")).toBe("0");
    // Out of the polite region, so it isn't read twice…
    expect(toast.getAttribute("aria-live")).toBe("off");
    // …because Base UI's assertive copy reads it.
    const alert = document.querySelector("[role=alert]") as HTMLElement;
    expect(alert.textContent).toBe("Payment failedCard declined.");
    await expect
      .element(page.getByRole("alertdialog", { name: "Payment failed" }))
      .toHaveAccessibleDescription("Card declined.");
    expect(
      page.getByRole("button", { name: "Dismiss" }).element().hasAttribute("aria-hidden"),
    ).toBe(false);
    await settled();
    const result = await axe.run(document.body, {
      runOnly: { type: "rule", values: ["aria-hidden-focus"] },
    });
    expect(result.violations).toEqual([]);
    await expectAccessible(document.body);
  });

  it("a danger toast rejoins the polite region while the region has focus, as Base UI intends", async () => {
    await render(
      <ToastProvider>
        <Trigger label="Error" options={{ title: "Payment failed", tone: "danger" }} />
      </ToastProvider>,
    );
    await page.getByRole("button", { name: "Error" }).click();
    await expect.poll(() => toasts()[0]?.getAttribute("aria-live")).toBe("off");
    // F6 moves focus into the region: Base UI drops its alert copy and reads toasts politely.
    await userEvent.keyboard("{F6}");
    await expect
      .poll(() => document.activeElement?.getAttribute("data-slot"))
      .toBe("toast-viewport");
    await expect.poll(() => toasts()[0]?.hasAttribute("aria-live")).toBe(false);
    expect(document.querySelector("[role=alert]")).toBeNull();
    expect(toasts()[0]?.hasAttribute("aria-hidden")).toBe(false);
  });

  it("draws its Dismiss button in the neutral tone, as a utility icon", async () => {
    await render(
      <ToastProvider>
        <Trigger options={{ title: "Invoice sent" }} />
      </ToastProvider>,
    );
    await page.getByRole("button", { name: "Show" }).click();
    const close = toasts()[0]?.querySelector("[data-slot=icon-button]") as HTMLElement;
    expect(close.dataset.tone).toBe("neutral");
    expect(getComputedStyle(close).color).toBe(tokenColor("--qx-color-text-subtle"));
  });

  it("useToast returns the same object on every render", async () => {
    const seen: ToastApi[] = [];
    await render(
      <ToastProvider>
        <Probe seen={seen} />
      </ToastProvider>,
    );
    await page.getByRole("button", { name: "Send" }).click();
    await page.getByRole("button", { name: "Send" }).click();
    await expect.poll(() => toasts().length).toBe(2);
    expect(seen.length).toBeGreaterThan(2);
    expect(new Set(seen).size).toBe(1);
  });

  it("names its icon and content", async () => {
    await render(
      <ToastProvider>
        <Trigger options={{ title: "Invoice sent", tone: "success" }} />
      </ToastProvider>,
    );
    await page.getByRole("button", { name: "Show" }).click();
    await expect.poll(() => toasts().length).toBe(1);
    const toast = toasts()[0] as HTMLElement;
    expect(slot("toast-icon", toast).getAttribute("aria-hidden")).toBe("true");
    expect(slot("toast-content", toast).contains(slot("toast-title", toast))).toBe(true);
  });

  it("a pending promise shows a spinner where the icon goes, then the icon, without a jump", async () => {
    let resolve: (value: string) => void = () => {};
    const saving = new Promise<string>((r) => {
      resolve = r;
    });
    await render(
      <ToastProvider>
        <Pending saving={saving} />
      </ToastProvider>,
    );
    await page.getByRole("button", { name: "Save" }).click();
    await expect.element(page.getByText("Saving invoice…")).toBeVisible();
    const toast = toasts()[0] as HTMLElement;
    expect(toast.dataset.tone).toBe("info");
    expect(toast.hasAttribute("data-loading")).toBe(true);
    const spinner = slot("toast-icon", toast);
    expect(spinner.querySelector("[data-slot=spinner]")?.getAttribute("aria-hidden")).toBe("true");
    await settled();
    const pendingIcon = spinner.getBoundingClientRect();
    const pendingTitle = slot("toast-title", toast).getBoundingClientRect();
    const pendingHeight = toast.getBoundingClientRect().height;
    resolve("INV-0042");
    await expect.element(page.getByText("Invoice saved")).toBeVisible();
    expect(toast.dataset.tone).toBe("success");
    expect(toast.hasAttribute("data-loading")).toBe(false);
    const icon = slot("toast-icon", toast).getBoundingClientRect();
    // The spinner's box is the icon's: same place, same size, and the title doesn't move.
    expect([icon.left, icon.top, icon.width, icon.height]).toEqual([
      pendingIcon.left,
      pendingIcon.top,
      pendingIcon.width,
      pendingIcon.height,
    ]);
    expect(slot("toast-title", toast).getBoundingClientRect().left).toBe(pendingTitle.left);
    expect(toast.getBoundingClientRect().height).toBe(pendingHeight);
  });

  it("a rejected promise ends as a danger toast: its icon, its edge, and it stays", async () => {
    let reject: (reason: Error) => void = () => {};
    const saving = new Promise<string>((_, r) => {
      reject = r;
    });
    await render(
      <ToastProvider timeout={300}>
        <Pending saving={saving} />
      </ToastProvider>,
    );
    await page.getByRole("button", { name: "Save" }).click();
    await expect.element(page.getByText("Saving invoice…")).toBeVisible();
    reject(new Error("offline"));
    // Base UI names a rejected promise's toast "error"; it's Qeetrix's danger tone.
    await expect
      .element(page.getByRole("alertdialog", { name: "Couldn't save the invoice" }))
      .toBeVisible();
    const toast = toasts()[0] as HTMLElement;
    expect(toast.dataset.tone).toBe("danger");
    expect(getComputedStyle(toast).borderInlineStartColor).toBe(
      tokenColor("--qx-color-icon-danger"),
    );
    expect(toast.getAttribute("aria-live")).toBe("off");
    await new Promise((r) => setTimeout(r, 600));
    expect(toasts()).toHaveLength(1);
  });

  it("a promise keeps the tone its caller chose", async () => {
    let reject: (reason: Error) => void = () => {};
    const saving = new Promise<string>((_, r) => {
      reject = r;
    });
    await render(
      <ToastProvider>
        <Pending saving={saving} error={{ title: "Saved offline", tone: "warning" }} />
      </ToastProvider>,
    );
    await page.getByRole("button", { name: "Save" }).click();
    await expect.element(page.getByText("Saving invoice…")).toBeVisible();
    reject(new Error("offline"));
    await expect.element(page.getByText("Saved offline")).toBeVisible();
    expect(toasts()[0]?.dataset.tone).toBe("warning");
  });

  it("looks right while a promise is pending", async () => {
    await page.viewport(420, 200);
    await render(
      <ToastProvider>
        <Pending saving={new Promise(() => {})} />
      </ToastProvider>,
    );
    await page.getByRole("button", { name: "Save" }).click();
    await expect.element(page.getByText("Saving invoice…")).toBeVisible();
    await expectAccessible(document.body);
    await screenshotSchemes("Toast · loading", null);
  });

  it("is accessible and looks right in both schemes", async () => {
    await page.viewport(420, 320);
    await render(
      <ToastProvider>
        <Trigger
          label="Info"
          options={{ title: "Export started", description: "We'll email you the file." }}
        />
        <Trigger
          label="Undo"
          options={{
            title: "Invoice deleted",
            tone: "warning",
            action: { label: "Undo", onClick: () => {} },
          }}
        />
        <Trigger
          label="Error"
          options={{ title: "Payment failed", description: "Card declined.", tone: "danger" }}
        />
      </ToastProvider>,
    );
    for (const name of ["Info", "Undo", "Error"]) await page.getByRole("button", { name }).click();
    await expect.poll(() => toasts().length).toBe(3);
    await expectAccessible(document.body);
    await screenshotSchemes("Toast", null);
  });
});
