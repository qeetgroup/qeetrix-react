import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Button } from "../button/button";
import { type ToastOptions, ToastProvider, useToast } from "./toast";

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
