import { DownloadIcon } from "@qeetrix/icons/icons/download";
import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Button, IconButton } from "../button/button";
import { Tooltip, TooltipProvider } from "./tooltip";

const popup = () => document.querySelector("[data-slot=tooltip-popup]");

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
