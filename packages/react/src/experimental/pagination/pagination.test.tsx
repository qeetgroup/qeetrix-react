import { afterEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotEveryMode } from "../../../tests/support/screenshots";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { Pagination, ShowMore } from "./pagination";

const range = () => document.querySelector("[data-slot=pagination-range]") as HTMLElement;
/** The left edges of the range's numbers, in the order they're read. */
const numberEdges = () =>
  [...range().querySelectorAll("bdi")].map((n) => Math.round(n.getBoundingClientRect().left));

afterEach(() => {
  document.documentElement.removeAttribute("dir");
});
const button = (name: string) => page.getByRole("button", { name });

describe("Pagination", () => {
  it("is a named navigation with the range on show, announced when it changes", async () => {
    await render(<Pagination offset={0} pageSize={25} total={1284} onOffsetChange={() => {}} />);
    await expect.element(page.getByRole("navigation", { name: "Pagination" })).toBeVisible();
    expect(range().textContent).toBe("1–25 of 1,284");
    expect(range().getAttribute("role")).toBe("status");
  });

  it("takes another name from aria-label", async () => {
    await render(
      <Pagination
        aria-label="Invoice pages"
        offset={0}
        pageSize={25}
        total={60}
        onOffsetChange={() => {}}
      />,
    );
    await expect.element(page.getByRole("navigation", { name: "Invoice pages" })).toBeVisible();
    expect(page.getByRole("navigation", { name: "Pagination" }).query()).toBeNull();
  });

  it("keeps “26–50 of 1,284” in reading order on a right-to-left page", async () => {
    document.documentElement.dir = "rtl";
    const { rerender } = await render(
      <QeetrixProvider direction="rtl">
        <Pagination offset={25} pageSize={25} total={1284} onOffsetChange={() => {}} />
      </QeetrixProvider>,
    );
    expect(range().textContent).toBe("26–50 of 1,284");
    // Each number is isolated, and the range runs in its own language's direction.
    const [start, end, total] = numberEdges();
    expect(start).toBeLessThan(end as number);
    expect(end).toBeLessThan(total as number);
    expect(getComputedStyle(range()).direction).toBe("ltr");
    // Without a total, the bare range keeps its order too.
    await rerender(
      <QeetrixProvider direction="rtl">
        <Pagination offset={25} pageSize={25} itemsOnPage={25} onOffsetChange={() => {}} />
      </QeetrixProvider>,
    );
    expect(range().textContent).toBe("26–50");
    const [from, to] = numberEdges();
    expect(from).toBeLessThan(to as number);
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

describe("Pagination with a cursor API", () => {
  it("offers Previous and Next alone, from hasPrevious and hasNext", async () => {
    const onNext = vi.fn();
    const onPrevious = vi.fn();
    await render(
      <Pagination
        pageSize={25}
        hasPrevious={false}
        hasNext
        onNext={onNext}
        onPrevious={onPrevious}
      />,
    );
    expect(page.getByRole("button", { name: "First page" }).elements()).toHaveLength(0);
    expect(page.getByRole("button", { name: "Last page" }).elements()).toHaveLength(0);
    expect(document.querySelector("[data-slot=pagination-range]")).toBeNull();
    await expect
      .element(page.getByRole("button", { name: "Previous page" }))
      .toHaveAttribute("aria-disabled", "true");
    await page.getByRole("button", { name: "Next page" }).click();
    expect(onNext).toHaveBeenCalledOnce();
    expect(onPrevious).not.toHaveBeenCalled();
  });

  it("shows the range when the page knows its offset", async () => {
    await render(
      <Pagination
        pageSize={25}
        offset={25}
        hasPrevious
        hasNext={false}
        onNext={() => {}}
        onPrevious={() => {}}
      />,
    );
    await expect.element(page.getByText("26–50")).toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Next page" }))
      .toHaveAttribute("aria-disabled", "true");
  });
});

describe("ShowMore", () => {
  it("appends the next page, then says that's everything", async () => {
    const onMore = vi.fn();
    const { rerender } = await render(
      <ShowMore hasMore onMore={onMore} label="Show older events" />,
    );
    await page.getByRole("button", { name: "Show older events" }).click();
    expect(onMore).toHaveBeenCalledOnce();
    await rerender(
      <ShowMore hasMore={false} onMore={onMore} end="That's everything since 29 September" />,
    );
    expect(page.getByRole("button").elements()).toHaveLength(0);
    await expect
      .element(page.getByRole("status"))
      .toHaveTextContent("That's everything since 29 September");
  });
});
