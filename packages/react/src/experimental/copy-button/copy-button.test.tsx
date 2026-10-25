import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Stage } from "../../../tests/support/stage";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { CopyButton } from "./copy-button";

const original = Object.getOwnPropertyDescriptor(navigator, "clipboard");
let writeText: ReturnType<typeof vi.fn>;
beforeEach(() => {
  writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
});
afterEach(() => {
  if (original) Object.defineProperty(navigator, "clipboard", original);
});

const status = () => document.querySelector("[role=status]") as HTMLElement;
const tooltip = () => document.querySelector("[data-slot=tooltip-popup]");

describe("CopyButton", () => {
  it("copies its value, turns into a check, announces it, and keeps focus", async () => {
    const onCopied = vi.fn();
    await render(<CopyButton value="usr_8f2k1" label="Copy user ID" onCopied={onCopied} />);
    const button = page.getByRole("button", { name: "Copy user ID" });
    await button.click();
    await expect.poll(() => status().textContent).toBe("Copied");
    expect(writeText).toHaveBeenCalledWith("usr_8f2k1");
    expect(onCopied).toHaveBeenCalledWith("usr_8f2k1");
    await expect.element(button).toHaveAttribute("data-state", "copied");
    await expect.element(button).toHaveFocus();
  });

  it("resets after the delay, and announces a second copy again", async () => {
    await render(<CopyButton value="x" resetAfter={50} />);
    const button = page.getByRole("button", { name: "Copy" });
    await button.click();
    await expect.poll(() => status().textContent).toBe("Copied");
    await expect.poll(() => button.element().getAttribute("data-state")).toBe("idle");
    expect(status().textContent).toBe("");
  });

  it("copies what a function returns, even later", async () => {
    await render(<CopyButton value={async () => "tok_fresh"} label="Copy token" />);
    await page.getByRole("button", { name: "Copy token" }).click();
    await expect.poll(() => writeText.mock.calls[0]?.[0]).toBe("tok_fresh");
  });

  it("fails visibly when there's no clipboard", async () => {
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    const onCopyError = vi.fn();
    await render(<CopyButton value="x" onCopyError={onCopyError} />);
    await page.getByRole("button", { name: "Copy" }).click();
    await expect.poll(() => status().textContent).toBe("Couldn't copy");
    expect(onCopyError).toHaveBeenCalledOnce();
  });

  it("becomes a labelled Button when given a visible label", async () => {
    await render(<CopyButton value="sk_live_…">Copy secret</CopyButton>);
    const button = page.getByRole("button", { name: "Copy secret" });
    await expect.element(button).toHaveAttribute("data-slot", "button");
  });

  it("with a visible label: its tooltip shows `label`, then says Copied", async () => {
    await render(
      <div style={{ padding: 48 }}>
        <CopyButton value="sk_live_8f2k" label="Copy the client secret">
          Copy secret
        </CopyButton>
      </div>,
    );
    // The visible label names it; `label` is the tooltip, which describes it.
    const button = page.getByRole("button", { name: "Copy secret" });
    await userEvent.keyboard("{Tab}");
    await expect.element(button).toHaveFocus();
    await expect.poll(() => tooltip()?.textContent).toBe("Copy the client secret");
    await expect.element(button).toHaveAccessibleDescription("Copy the client secret");
    await userEvent.keyboard("{Enter}");
    await expect.poll(() => status().textContent).toBe("Copied");
    expect(writeText).toHaveBeenCalledWith("sk_live_8f2k");
    await expect.poll(() => tooltip()?.textContent).toBe("Copied");
    await expect.element(button).toHaveFocus();
  });

  it("with a visible label and no `label`: no tooltip until it copies", async () => {
    await render(
      <div style={{ padding: 48 }}>
        <CopyButton value="x" resetAfter={200}>
          Copy secret
        </CopyButton>
      </div>,
    );
    await userEvent.keyboard("{Tab}");
    await expect.element(page.getByRole("button", { name: "Copy secret" })).toHaveFocus();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(tooltip()).toBeNull();
    await userEvent.keyboard("{Enter}");
    await expect.poll(() => tooltip()?.textContent).toBe("Copied");
    await expect.poll(tooltip).toBeNull();
  });

  it("icon-only: holds its tooltip open on Copied after a click, then lets it go", async () => {
    await render(
      <div style={{ padding: 48 }}>
        <CopyButton value="usr_8f2k1" label="Copy user ID" resetAfter={300} />
      </div>,
    );
    await page.getByRole("button", { name: "Copy user ID" }).click();
    await expect.poll(() => tooltip()?.textContent).toBe("Copied");
    await expect.poll(() => tooltip()?.textContent ?? null).not.toBe("Copied");
  });

  it("speaks Hindi through QeetrixProvider", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <CopyButton value="x" />
      </QeetrixProvider>,
    );
    await page.getByRole("button", { name: "कॉपी करें" }).click();
    await expect.poll(() => status().textContent).toBe("कॉपी हो गया");
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <CopyButton value="a" label="Copy user ID" />
        <CopyButton value="b" label="Copy event ID" />
        <CopyButton value="c" variant="soft">
          Copy secret
        </CopyButton>
      </Stage>,
    );
    await page.getByRole("button", { name: "Copy event ID" }).click();
    // Each button has its own announcement; the second one copied.
    await expect
      .poll(() => document.querySelectorAll("[role=status]")[1]?.textContent)
      .toBe("Copied");
    await expectAccessible(container);
    await screenshotSchemes("CopyButton", "[data-qx-stage]");
  });
});
