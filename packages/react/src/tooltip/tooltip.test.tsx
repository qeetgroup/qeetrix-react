import { DownloadIcon } from "@qeetrix/icons/icons/download";
import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Button, IconButton } from "../button/button";
import { Tooltip, TooltipProvider } from "./tooltip";

const popup = () => document.querySelector("[data-slot=tooltip-popup]");
const rect = (element: Element | null) => (element as Element).getBoundingClientRect();

describe("Tooltip", () => {
  it("opens at once on keyboard focus and closes on Escape", async () => {
    await render(
      <Tooltip content="Export as CSV">
        <Button variant="soft">Export</Button>
      </Tooltip>,
    );
    await userEvent.keyboard("{Tab}");
    await expect.poll(() => popup()?.textContent).toBe("Export as CSV");
    await userEvent.keyboard("{Escape}");
    await expect.poll(popup).toBeNull();
  });

  it("waits 500ms on hover before it opens", async () => {
    await render(
      <Tooltip content="Export as CSV">
        <Button variant="soft">Export</Button>
      </Tooltip>,
    );
    const started = performance.now();
    await page.getByRole("button", { name: "Export" }).hover();
    await expect.poll(popup, { timeout: 2000 }).not.toBeNull();
    expect(performance.now() - started).toBeGreaterThanOrEqual(450);
  });

  it("shows an IconButton's aria-label, unless turned off", async () => {
    await render(
      <TooltipProvider>
        <IconButton icon={DownloadIcon} aria-label="Download invoice" />
        <IconButton icon={DownloadIcon} aria-label="Download receipt" tooltip={false} />
      </TooltipProvider>,
    );
    await userEvent.keyboard("{Tab}");
    await expect.poll(() => popup()?.textContent).toBe("Download invoice");
    await userEvent.keyboard("{Tab}");
    await expect.poll(popup).toBeNull();
  });

  it("describes its trigger while it's open: role=tooltip, linked by aria-describedby", async () => {
    await render(
      <Tooltip content="Export as CSV">
        <Button variant="soft">Export</Button>
      </Tooltip>,
    );
    const button = page.getByRole("button", { name: "Export" });
    await expect.element(button).not.toHaveAttribute("aria-describedby");
    await userEvent.keyboard("{Tab}");
    await expect.poll(popup).not.toBeNull();
    expect(popup()?.getAttribute("role")).toBe("tooltip");
    await expect.element(button).toHaveAttribute("aria-describedby", popup()?.id);
    await expect.element(button).toHaveAccessibleDescription("Export as CSV");
    await userEvent.keyboard("{Escape}");
    await expect.poll(popup).toBeNull();
    await expect.element(button).not.toHaveAttribute("aria-describedby");
  });

  it("doesn't link a tooltip that only repeats the trigger's name", async () => {
    // Clear of the pointer, which an earlier test left over the top start corner.
    await render(
      <div style={{ padding: 64 }}>
        <TooltipProvider>
          <IconButton icon={DownloadIcon} aria-label="Download invoice" />
          <IconButton icon={DownloadIcon} aria-label="Download" tooltip="Download as PDF" />
          <Tooltip content="Archive">
            <Button>Archive</Button>
          </Tooltip>
        </TooltipProvider>
      </div>,
    );
    // An IconButton's own label: shown, but not read a second time.
    await userEvent.keyboard("{Tab}");
    await expect.poll(() => popup()?.textContent).toBe("Download invoice");
    const invoice = page.getByRole("button", { name: "Download invoice" });
    await expect.element(invoice).not.toHaveAttribute("aria-describedby");
    // Other text describes it.
    await userEvent.keyboard("{Tab}");
    await expect.poll(() => popup()?.textContent).toBe("Download as PDF");
    await expect
      .element(page.getByRole("button", { name: "Download", exact: true }))
      .toHaveAccessibleDescription("Download as PDF");
    // A trigger named by its own text, read from the trigger.
    await userEvent.keyboard("{Tab}");
    await expect.poll(() => popup()?.textContent).toBe("Archive");
    await expect
      .element(page.getByRole("button", { name: "Archive" }))
      .not.toHaveAttribute("aria-describedby");
  });

  it("keeps the trigger's own description alongside its own", async () => {
    await render(
      <>
        <p id="hint">Ends every session.</p>
        <Tooltip content="Signs out everywhere">
          <Button aria-describedby="hint">Sign out</Button>
        </Tooltip>
      </>,
    );
    await userEvent.keyboard("{Tab}");
    await expect.poll(popup).not.toBeNull();
    await expect
      .element(page.getByRole("button", { name: "Sign out" }))
      .toHaveAccessibleDescription("Ends every session. Signs out everywhere");
  });

  it("sits 8px from its trigger, or `sideOffset` pixels", async () => {
    const { rerender } = await render(
      <div style={{ padding: 64 }}>
        <Tooltip content="Download invoice" defaultOpen>
          <Button>Download</Button>
        </Tooltip>
      </div>,
    );
    await expect.poll(popup).not.toBeNull();
    const trigger = page.getByRole("button", { name: "Download" }).element();
    await expect.poll(() => Math.round(rect(trigger).top - rect(popup()).bottom)).toBe(8);
    await rerender(
      <div style={{ padding: 64 }}>
        <Tooltip content="Download invoice" defaultOpen sideOffset={12}>
          <Button>Download</Button>
        </Tooltip>
      </div>,
    );
    await expect.poll(() => Math.round(rect(trigger).top - rect(popup()).bottom)).toBe(12);
  });

  it("points at its trigger: a graphite triangle in the middle of the side facing it", async () => {
    await render(
      <div style={{ padding: 64 }}>
        <Tooltip content="Download invoice" defaultOpen>
          <Button>Download</Button>
        </Tooltip>
      </div>,
    );
    await expect.poll(popup).not.toBeNull();
    const trigger = rect(page.getByRole("button", { name: "Download" }).element());
    const arrow = () => document.querySelector("[data-slot=tooltip-arrow]") as HTMLElement;
    await expect.poll(() => Math.round(rect(arrow()).top - rect(popup()).bottom)).toBe(0);
    const box = rect(arrow());
    expect(Math.round(box.width)).toBe(10);
    expect(Math.round(box.height)).toBe(5);
    expect(Math.round(box.left + box.width / 2)).toBe(Math.round(trigger.left + trigger.width / 2));
    expect(Math.round(trigger.top - box.bottom)).toBe(3);
    const style = getComputedStyle(arrow());
    expect(style.backgroundColor).toBe(getComputedStyle(popup() as Element).backgroundColor);
    expect(style.clipPath).toContain("polygon");
    expect(arrow().getAttribute("aria-hidden")).toBe("true");
  });

  it("points sideways from a tooltip at the trigger's side", async () => {
    await render(
      <div style={{ padding: 64 }}>
        <Tooltip content="Download invoice" defaultOpen side="right">
          <Button>Download</Button>
        </Tooltip>
      </div>,
    );
    await expect.poll(popup).not.toBeNull();
    const trigger = rect(page.getByRole("button", { name: "Download" }).element());
    const arrow = () => document.querySelector("[data-slot=tooltip-arrow]") as HTMLElement;
    await expect.poll(() => Math.round(rect(popup()).left - rect(arrow()).right)).toBe(0);
    const box = rect(arrow());
    expect([Math.round(box.width), Math.round(box.height)]).toEqual([5, 10]);
    expect(Math.round(box.top + box.height / 2)).toBe(Math.round(trigger.top + trigger.height / 2));
    expect(Math.round(box.left - trigger.right)).toBe(3);
  });

  it("IconButton opens its tooltip on `tooltipSide`", async () => {
    await page.viewport(320, 200);
    await render(
      <div style={{ padding: 64 }}>
        <IconButton icon={DownloadIcon} aria-label="Download" tooltipSide="bottom" />
      </div>,
    );
    await userEvent.keyboard("{Tab}");
    await expect.poll(popup).not.toBeNull();
    const button = page.getByRole("button", { name: "Download" }).element();
    await expect.poll(() => Math.round(rect(popup()).top - rect(button).bottom)).toBe(8);
    await expect.poll(() => popup()?.getAttribute("data-side")).toBe("bottom");
    await screenshotSchemes("Tooltip · bottom", null);
  });

  it("follows TooltipProvider's delay", async () => {
    await render(
      <TooltipProvider delay={100}>
        <Tooltip content="Export as CSV">
          <Button variant="soft">Export</Button>
        </Tooltip>
      </TooltipProvider>,
    );
    const started = performance.now();
    await page.getByRole("button", { name: "Export" }).hover();
    await expect.poll(popup, { timeout: 2000, interval: 20 }).not.toBeNull();
    expect(performance.now() - started).toBeLessThan(450);
  });

  it("names its positioner", async () => {
    await render(
      <Tooltip content="Download invoice" defaultOpen>
        <Button>Download</Button>
      </Tooltip>,
    );
    await expect
      .poll(() => document.querySelector("[data-slot=tooltip-positioner]"))
      .not.toBeNull();
  });

  it("is accessible and looks right in both schemes", async () => {
    await page.viewport(320, 160);
    await render(
      <div style={{ padding: 64 }}>
        <Tooltip content="Download invoice" defaultOpen>
          <IconButton icon={DownloadIcon} aria-label="Download" tooltip={false} />
        </Tooltip>
      </div>,
    );
    await expect.poll(popup).not.toBeNull();
    const style = getComputedStyle(popup() as Element);
    expect(style.borderRadius).toBe("2px");
    expect(style.boxShadow).toBe("none");
    await expectAccessible(document.body);
    await screenshotSchemes("Tooltip", null);
  });
});
