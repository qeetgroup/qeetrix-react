import { afterEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { FloatingPanel } from "./floating-panel";

const panel = () => document.querySelector("[data-slot=floating-panel]") as HTMLElement;
const rect = () => panel().getBoundingClientRect();

afterEach(() => localStorage.clear());

describe("FloatingPanel", () => {
  it("is a non-modal dialog that stays open while the page is used", async () => {
    await page.viewport(1200, 800);
    await render(
      <>
        <button type="button">Pick another icon</button>
        <FloatingPanel defaultOpen title="Arrow right">
          Details
        </FloatingPanel>
      </>,
    );
    await expect.element(page.getByRole("dialog", { name: "Arrow right" })).toBeVisible();
    await userEvent.click(page.getByRole("button", { name: "Pick another icon" }));
    await expect.element(page.getByRole("dialog", { name: "Arrow right" })).toBeVisible();
    await userEvent.click(page.getByRole("button", { name: "Close" }));
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
  });

  it("moves by its handle's arrow keys and resizes by its corner's, kept inside the window", async () => {
    await page.viewport(1200, 800);
    const onPlaceChange = vi.fn();
    await render(
      <FloatingPanel
        defaultOpen
        title="Details"
        defaultPlace={{ start: 100, top: 100, width: 360, height: 300 }}
        onPlaceChange={onPlaceChange}
        topOffset={56}
      >
        Body
      </FloatingPanel>,
    );
    await expect.poll(() => Math.round(rect().left)).toBe(100);
    page.getByRole("button", { name: "Move panel" }).element().focus();
    await userEvent.keyboard("{ArrowRight}{Shift>}{ArrowDown}{/Shift}");
    expect([Math.round(rect().left), Math.round(rect().top)]).toEqual([116, 164]);
    await userEvent.keyboard("{Shift>}{ArrowUp}{ArrowUp}{ArrowUp}{/Shift}");
    expect(Math.round(rect().top)).toBe(56);
    page.getByRole("button", { name: "Resize panel" }).element().focus();
    await userEvent.keyboard("{ArrowRight}{ArrowDown}");
    expect([Math.round(rect().width), Math.round(rect().height)]).toEqual([376, 316]);
    expect(onPlaceChange).toHaveBeenLastCalledWith({
      start: 116,
      top: 56,
      width: 376,
      height: 316,
    });
    await userEvent.keyboard("{Shift>}{ArrowLeft}{ArrowLeft}{/Shift}");
    expect(Math.round(rect().width)).toBe(280);
  });

  it("moves by dragging its head, remembers its place, and goes back on a double-click", async () => {
    await page.viewport(1200, 800);
    const { unmount } = await render(
      <FloatingPanel
        defaultOpen
        title="Details"
        storageKey="icons-panel"
        defaultPlace={{ start: 100, top: 100, width: 360, height: 300 }}
      >
        Body
      </FloatingPanel>,
    );
    const head = document.querySelector("[data-slot=floating-panel-head]") as HTMLElement;
    const at = head.getBoundingClientRect();
    const fire = (type: string, x: number, y: number) =>
      head.dispatchEvent(
        new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0, pointerId: 1 }),
      );
    fire("pointerdown", at.left + 120, at.top + 10);
    fire("pointermove", at.left + 170, at.top + 40);
    fire("pointerup", at.left + 170, at.top + 40);
    await expect.poll(() => Math.round(rect().left)).toBe(150);
    expect(JSON.parse(localStorage.getItem("icons-panel") ?? "{}")).toMatchObject({
      start: 150,
      top: 130,
    });
    await unmount();
    await render(
      <FloatingPanel
        defaultOpen
        title="Details"
        storageKey="icons-panel"
        defaultPlace={{ start: 100, top: 100, width: 360, height: 300 }}
      >
        Body
      </FloatingPanel>,
    );
    await expect.poll(() => Math.round(rect().left)).toBe(150);
    await userEvent.dblClick(page.getByText("Details"));
    await expect.poll(() => Math.round(rect().left)).toBe(100);
  });

  it("is a bottom sheet on a narrow screen, without its handles", async () => {
    await page.viewport(480, 800);
    await render(
      <FloatingPanel defaultOpen title="Details">
        Body
      </FloatingPanel>,
    );
    await expect.poll(() => Math.round(rect().bottom)).toBe(800);
    expect([Math.round(rect().left), Math.round(rect().width)]).toEqual([0, 480]);
    const move = panel().querySelector("[data-move]") as HTMLElement;
    expect(getComputedStyle(move).display).toBe("none");
  });

  it("is accessible and looks right in both schemes", async () => {
    await page.viewport(800, 560);
    await render(
      <FloatingPanel
        defaultOpen
        title="Arrow right"
        defaultPlace={{ start: 200, top: 40, width: 360, height: 280 }}
      >
        The arrow-right icon, in the sharp and round shapes.
      </FloatingPanel>,
    );
    await expectAccessible(document.body);
    await screenshotEveryMode("FloatingPanel", null);
  });
});
