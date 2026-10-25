import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { Pagination } from "./pagination";

const range = () => document.querySelector("[data-slot=pagination-range]") as HTMLElement;
const button = (name: string) => page.getByRole("button", { name });

describe("Pagination", () => {
  it("is a named navigation with the range on show, announced when it changes", async () => {
    await render(<Pagination offset={0} pageSize={25} total={1284} onOffsetChange={() => {}} />);
    await expect.element(page.getByRole("navigation", { name: "Pagination" })).toBeVisible();
    expect(range().textContent).toBe("1–25 of 1,284");
    expect(range().getAttribute("role")).toBe("status");
  });

  it("steps by offset: first, previous and next, off at the ends", async () => {
    const onOffsetChange = vi.fn();
    const { rerender } = await render(
      <Pagination offset={0} pageSize={25} total={60} onOffsetChange={onOffsetChange} />,
    );
    await expect.element(button("First page")).toHaveAttribute("aria-disabled", "true");
    await expect.element(button("Previous page")).toHaveAttribute("aria-disabled", "true");
    await button("Next page").click();
    expect(onOffsetChange).toHaveBeenLastCalledWith(25);
    await rerender(
      <Pagination offset={50} pageSize={25} total={60} onOffsetChange={onOffsetChange} />,
    );
    expect(range().textContent).toBe("51–60 of 60");
    await expect.element(button("Next page")).toHaveAttribute("aria-disabled", "true");
    await button("Previous page").click();
    expect(onOffsetChange).toHaveBeenLastCalledWith(25);
    await button("First page").click();
    expect(onOffsetChange).toHaveBeenLastCalledWith(0);
  });

  it("jumps to the last page when the total is known, and offers no Last without one", async () => {
    const onOffsetChange = vi.fn();
    const { rerender } = await render(
      <Pagination offset={0} pageSize={25} total={1284} onOffsetChange={onOffsetChange} />,
    );
    await button("Last page").click();
    expect(onOffsetChange).toHaveBeenLastCalledWith(1275);
    await rerender(
      <Pagination offset={1275} pageSize={25} total={1284} onOffsetChange={onOffsetChange} />,
    );
    expect(range().textContent).toBe("1,276–1,284 of 1,284");
    await expect.element(button("Last page")).toHaveAttribute("aria-disabled", "true");
    await rerender(
      <Pagination offset={0} pageSize={25} itemsOnPage={25} onOffsetChange={onOffsetChange} />,
    );
    expect(page.getByRole("button", { name: "Last page" }).elements()).toHaveLength(0);
  });

  it("works without a total: Next stays on while a full page comes back", async () => {
    const { rerender } = await render(
      <Pagination offset={25} pageSize={25} itemsOnPage={25} onOffsetChange={() => {}} />,
    );
    expect(range().textContent).toBe("26–50");
    await expect.element(button("Next page")).toHaveAttribute("aria-disabled", "false");
    await rerender(
      <Pagination offset={50} pageSize={25} itemsOnPage={7} onOffsetChange={() => {}} />,
    );
    expect(range().textContent).toBe("51–57");
    await expect.element(button("Next page")).toHaveAttribute("aria-disabled", "true");
  });

  it("turns its buttons off while loading", async () => {
    await render(
      <Pagination offset={25} pageSize={25} total={100} loading onOffsetChange={() => {}} />,
    );
    for (const name of ["First page", "Previous page", "Next page", "Last page"])
      await expect.element(button(name)).toHaveAttribute("aria-disabled", "true");
  });

  it("offers rows per page", async () => {
    const onPageSizeChange = vi.fn();
    await render(
      <Pagination
        offset={0}
        pageSize={25}
        total={1284}
        pageSizes={[25, 50, 100]}
        onPageSizeChange={onPageSizeChange}
        onOffsetChange={() => {}}
      />,
    );
    await page.getByRole("combobox", { name: "Rows per page" }).click();
    await page.getByRole("option", { name: "50" }).click();
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it("formats numbers and speaks Hindi through QeetrixProvider", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <Pagination offset={0} pageSize={25} total={128400} onOffsetChange={() => {}} />
      </QeetrixProvider>,
    );
    await expect.element(page.getByRole("navigation", { name: "पेज नेविगेशन" })).toBeVisible();
    expect(range().textContent).toBe("1,28,400 में से 1–25");
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(760, 200);
    const { container } = await render(
      <div
        data-qx-stage=""
        style={{
          display: "grid",
          gap: 16,
          padding: 16,
          inlineSize: 680,
          background: "var(--qx-color-surface-default)",
        }}
      >
        <Pagination offset={25} pageSize={25} total={1284} onOffsetChange={() => {}} />
        <Pagination
          offset={0}
          pageSize={25}
          total={1284}
          pageSizes={[25, 50, 100]}
          onPageSizeChange={() => {}}
          onOffsetChange={() => {}}
        />
      </div>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("Pagination", "[data-qx-stage]");
  });
});
