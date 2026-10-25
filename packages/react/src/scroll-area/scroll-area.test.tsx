import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { ScrollArea } from "./scroll-area";

const ROWS = Array.from({ length: 30 }, (_, i) => `INV-2026-${String(i + 1).padStart(4, "0")}`);

function Activity({ blockSize = 160 }: { blockSize?: number }) {
  return (
    <ScrollArea style={{ blockSize, inlineSize: 240 }} aria-label="Recent invoices">
      <ul style={{ margin: 0, padding: 8 }}>
        {ROWS.map((row) => (
          <li key={row} style={{ padding: "4px 0" }}>
            {row}
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}

const viewport = () => document.querySelector("[data-slot=scroll-area-viewport]") as HTMLElement;

describe("ScrollArea", () => {
  it("takes keyboard focus when it overflows, and scrolls with the keys", async () => {
    await render(<Activity />);
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(viewport());
    await userEvent.keyboard("{PageDown}");
    await expect.poll(() => viewport().scrollTop).toBeGreaterThan(0);
  });

  it("shows its scrollbar while hovered", async () => {
    // The pointer starts on a sibling: an earlier test can leave it anywhere.
    const { container } = await render(
      <>
        <p>Elsewhere</p>
        <Activity />
      </>,
    );
    const scrollbar = container.querySelector(".qx-scroll-area-scrollbar") as HTMLElement;
    await page.getByText("Elsewhere").hover();
    await expect.poll(() => getComputedStyle(scrollbar).opacity).toBe("0");
    await page.getByText("INV-2026-0001").hover();
    await expect.poll(() => getComputedStyle(scrollbar).opacity).toBe("1");
    expect(scrollbar.getBoundingClientRect().width).toBe(8);
  });

  it("shows its scrollbar while focused from the keyboard", async () => {
    const { container } = await render(<Activity />);
    await userEvent.keyboard("{Tab}");
    const scrollbar = container.querySelector(".qx-scroll-area-scrollbar") as HTMLElement;
    await expect.poll(() => getComputedStyle(scrollbar).opacity).toBe("1");
  });

  it("is accessible and looks right in both schemes", async () => {
    const { container } = await render(
      <Stage>
        <Activity />
      </Stage>,
    );
    await userEvent.keyboard("{Tab}");
    await expectAccessible(container);
    await screenshotSchemes("ScrollArea");
  });
});
