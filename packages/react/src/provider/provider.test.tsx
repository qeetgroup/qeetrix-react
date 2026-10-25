import { afterEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { canEmulateMedia, emulateMedia } from "../../tests/support/media";
import { Dialog, DialogContent } from "../dialog/dialog";
import { Field } from "../field/field";
import { Input } from "../input/input";
import { hi } from "../locales/hi";
import { Slider } from "../slider/slider";
import { ToastProvider } from "../toast/toast";
import { QeetrixProvider, useColorScheme, useLocale } from "./provider";

function SchemeSwitch() {
  const { colorScheme, resolvedColorScheme, setColorScheme } = useColorScheme();
  return (
    <button type="button" onClick={() => setColorScheme("dark")}>
      {colorScheme}/{resolvedColorScheme}
    </button>
  );
}

function Locale() {
  return <output>{useLocale()}</output>;
}

describe("QeetrixProvider", () => {
  it("gives every client component its locale pack's strings", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <ToastProvider>
          <Field label="कंपनी" optional>
            <Input />
          </Field>
        </ToastProvider>
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("textbox", { name: "कंपनी (वैकल्पिक)" })).toBeVisible();
    await expect.element(page.getByRole("region", { name: /सूचनाएँ/ })).toBeInTheDocument();
  });

  it("reaches into portals: a dialog's close button", async () => {
    // A modal dialog makes the page behind it inert, so it gets a render of its own.
    await render(
      <QeetrixProvider messages={hi}>
        <Dialog defaultOpen>
          <DialogContent title="नाम बदलें" />
        </Dialog>
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("button", { name: "बंद करें" })).toBeVisible();
  });

  it("lets a component's own strings win over the provider's", async () => {
    await render(
      <QeetrixProvider messages={hi}>
        <Field label="Company" optional messages={{ optional: "(if any)" }}>
          <Input />
        </Field>
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("textbox", { name: "Company (if any)" })).toBeVisible();
  });

  it("nests: an inner provider inherits what it doesn't set", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <QeetrixProvider messages={{ field: { optional: "(optional)" } }}>
          <Locale />
          <Slider aria-label="Range" defaultValue={[10, 90]} />
          <Field label="Company" optional>
            <Input />
          </Field>
        </QeetrixProvider>
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("status")).toHaveTextContent("hi-IN");
    await expect.element(page.getByRole("slider", { name: /न्यूनतम/ })).toBeInTheDocument();
    await expect.element(page.getByRole("textbox", { name: "Company (optional)" })).toBeVisible();
  });

  it("formats values in its locale", async () => {
    const { container } = await render(
      <QeetrixProvider locale="de-DE">
        <Slider aria-label="Rate" showValue defaultValue={1234.5} max={5000} step={0.5} />
      </QeetrixProvider>,
    );
    expect(container.querySelector("[data-slot=slider-value]")?.textContent).toBe("1.234,5");
  });

  it("defaults to English and en-IN with no provider", async () => {
    await render(<Locale />);
    await expect.element(page.getByRole("status")).toHaveTextContent("en-IN");
  });
});

describe("colour scheme", () => {
  const html = document.documentElement;
  let reset: (() => Promise<void>) | undefined;
  afterEach(async () => {
    await reset?.();
    reset = undefined;
    delete html.dataset.qxColorScheme;
  });

  it("writes the chosen scheme to <html> and reports changes for the product to persist", async () => {
    const onColorSchemeChange = vi.fn();
    await render(
      <QeetrixProvider defaultColorScheme="light" onColorSchemeChange={onColorSchemeChange}>
        <SchemeSwitch />
      </QeetrixProvider>,
    );
    await expect.poll(() => html.dataset.qxColorScheme).toBe("light");
    await page.getByRole("button", { name: "light/light" }).click();
    await expect.poll(() => html.dataset.qxColorScheme).toBe("dark");
    expect(onColorSchemeChange).toHaveBeenLastCalledWith("dark");
  });

  it.runIf(canEmulateMedia)("follows the operating system while it's system", async () => {
    reset = await emulateMedia({ "prefers-color-scheme": "dark" });
    await render(
      <QeetrixProvider defaultColorScheme="system">
        <SchemeSwitch />
      </QeetrixProvider>,
    );
    await expect.poll(() => html.dataset.qxColorScheme).toBe("dark");
    await expect.element(page.getByRole("button", { name: "system/dark" })).toBeVisible();
  });

  it("leaves <html> alone when no provider manages the scheme", async () => {
    await render(
      <QeetrixProvider locale="hi-IN">
        <Locale />
      </QeetrixProvider>,
    );
    expect(html.dataset.qxColorScheme).toBeUndefined();
  });
});
