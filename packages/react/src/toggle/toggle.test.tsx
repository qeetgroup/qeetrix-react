import { BoldIcon } from "@qeetrix/icons/icons/bold";
import { ItalicIcon } from "@qeetrix/icons/icons/italic";
import { LayoutGridIcon } from "@qeetrix/icons/icons/layout-grid";
import { ListIcon } from "@qeetrix/icons/icons/list";
import { afterEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Inline } from "../inline/inline";
import { Toggle, ToggleGroup } from "./toggle";

const tooltip = () => document.querySelector("[data-slot=tooltip-popup]");

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Toggle", () => {
  it("toggles on click and Space, and reports the new state", async () => {
    const onPressedChange = vi.fn();
    await render(<Toggle icon={BoldIcon} aria-label="Bold" onPressedChange={onPressedChange} />);
    const toggle = page.getByRole("button", { name: "Bold" });
    await expect.element(toggle).toHaveAttribute("aria-pressed", "false");
    await toggle.click();
    await expect.element(toggle).toHaveAttribute("aria-pressed", "true");
    expect(onPressedChange).toHaveBeenLastCalledWith(true, expect.anything());
    await userEvent.keyboard(" ");
    await expect.element(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("shows the filled drawing while pressed", async () => {
    const { container } = await render(
      <Toggle icon={LayoutGridIcon} filledWhenPressed aria-label="Grid view" defaultPressed />,
    );
    const filled = container.querySelector("[data-slot=toggle-icon-filled]") as SVGElement;
    const outline = container.querySelector("[data-slot=toggle-icon]") as SVGElement;
    expect(filled.classList).toContain("qx-toggle-icon-filled");
    expect(outline.classList).toContain("qx-toggle-icon-outline");
    expect(getComputedStyle(filled).display).toBe("block");
    expect(getComputedStyle(outline).display).toBe("none");
  });

  it("an icon-only toggle shows its aria-label as a tooltip, without reading it twice", async () => {
    await render(<Toggle icon={BoldIcon} aria-label="Bold" />);
    await userEvent.keyboard("{Tab}");
    await expect.poll(() => tooltip()?.textContent).toBe("Bold");
    const toggle = page.getByRole("button", { name: "Bold" });
    await expect.element(toggle).toHaveFocus();
    await expect.element(toggle).not.toHaveAttribute("aria-describedby");
  });

  it("takes other tooltip text, or none, and a labelled toggle has none", async () => {
    await render(
      <Inline gap="md">
        <Toggle icon={BoldIcon} aria-label="Bold" tooltip="Bold (Ctrl+B)" />
        <Toggle icon={ItalicIcon} aria-label="Italic" tooltip={false} />
        <Toggle icon={ListIcon}>List</Toggle>
      </Inline>,
    );
    await userEvent.keyboard("{Tab}");
    await expect.poll(() => tooltip()?.textContent).toBe("Bold (Ctrl+B)");
    await expect
      .element(page.getByRole("button", { name: "Bold" }))
      .toHaveAccessibleDescription("Bold (Ctrl+B)");
    await userEvent.keyboard("{Tab}");
    await expect.element(page.getByRole("button", { name: "Italic" })).toHaveFocus();
    await expect.poll(tooltip).toBeNull();
    await userEvent.keyboard("{Tab}");
    await expect.element(page.getByRole("button", { name: "List" })).toHaveFocus();
    await expect.poll(tooltip).toBeNull();
  });

  it("opens an icon-only toggle's tooltip on `tooltipSide`", async () => {
    await render(
      <div style={{ padding: 64 }}>
        <Toggle icon={BoldIcon} aria-label="Bold" tooltipSide="bottom" />
      </div>,
    );
    await userEvent.keyboard("{Tab}");
    await expect.poll(() => tooltip()?.getAttribute("data-side")).toBe("bottom");
  });

  it("warns in development when an icon-only toggle has no name", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await render(
      <Inline gap="md">
        <Toggle icon={BoldIcon} aria-label="Bold" />
        <Toggle icon={ListIcon}>List</Toggle>
      </Inline>,
    );
    expect(warn).not.toHaveBeenCalled();
    await render(<Toggle icon={ItalicIcon} />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("aria-label"));
  });
});

describe("ToggleGroup", () => {
  it("presses one at a time by default", async () => {
    const onValueChange = vi.fn();
    await render(
      <ToggleGroup defaultValue={["grid"]} onValueChange={onValueChange} aria-label="View">
        <Toggle value="grid" icon={LayoutGridIcon}>
          Grid
        </Toggle>
        <Toggle value="list" icon={ListIcon}>
          List
        </Toggle>
      </ToggleGroup>,
    );
    await page.getByRole("button", { name: "List" }).click();
    await expect
      .element(page.getByRole("button", { name: "List" }))
      .toHaveAttribute("aria-pressed", "true");
    await expect
      .element(page.getByRole("button", { name: "Grid" }))
      .toHaveAttribute("aria-pressed", "false");
    expect(onValueChange).toHaveBeenLastCalledWith(["list"], expect.anything());
  });

  it("moves focus with the arrow keys, the tooltip following", async () => {
    await render(
      <ToggleGroup aria-label="Formatting" multiple variant="separate">
        <Toggle value="bold" icon={BoldIcon} aria-label="Bold" />
        <Toggle value="italic" icon={ItalicIcon} aria-label="Italic" />
      </ToggleGroup>,
    );
    await userEvent.keyboard("{Tab}");
    await expect.element(page.getByRole("button", { name: "Bold" })).toHaveFocus();
    await expect.poll(() => tooltip()?.textContent).toBe("Bold");
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(page.getByRole("button", { name: "Italic" })).toHaveFocus();
    await expect.poll(() => tooltip()?.textContent).toBe("Italic");
    await userEvent.keyboard(" ");
    await expect
      .element(page.getByRole("button", { name: "Italic" }))
      .toHaveAttribute("aria-pressed", "true");
  });

  it("keeps a segmented group at the control height", async () => {
    const { container } = await render(
      <ToggleGroup defaultValue={["a"]} aria-label="Period">
        <Toggle value="a">Day</Toggle>
        <Toggle value="b">Week</Toggle>
      </ToggleGroup>,
    );
    const group = container.querySelector("[data-slot=toggle-group]") as HTMLElement;
    expect(group.getBoundingClientRect().height).toBe(32);
  });

  it("draws a disabled pressed toggle as disabled, its choice shown by an edge", async () => {
    const { container } = await render(
      <ToggleGroup defaultValue={["week"]} aria-label="Period" variant="segmented" disabled>
        <Toggle value="day">Day</Toggle>
        <Toggle value="week">Week</Toggle>
      </ToggleGroup>,
    );
    const [day, week] = [...container.querySelectorAll<HTMLElement>(".qx-toggle")];
    const chosen = getComputedStyle(week as HTMLElement);
    // Not the bold fill a usable choice has: Button's disabled fill and text.
    expect(chosen.backgroundColor).toBe(tokenColor("--qx-color-bg-disabled"));
    expect(chosen.color).toBe(tokenColor("--qx-color-text-disabled"));
    expect(chosen.boxShadow).toContain(tokenColor("--qx-color-border-disabled"));
    // The other option has neither, so the choice still shows.
    expect(getComputedStyle(day as HTMLElement).boxShadow).toBe("none");
    expect(getComputedStyle(day as HTMLElement).backgroundColor).not.toBe(chosen.backgroundColor);
  });

  it("fills its row with equal toggles when fullWidth, labels centred, a long one cut", async () => {
    for (const dir of ["ltr", "rtl"] as const) {
      for (const variant of ["segmented", "separate"] as const) {
        for (const size of ["sm", "md", "lg"] as const) {
          const { container, unmount } = await render(
            <div dir={dir} style={{ inlineSize: 248 }}>
              <ToggleGroup
                fullWidth
                variant={variant}
                size={size}
                defaultValue={["contacts"]}
                aria-label="Who can add you"
              >
                <Toggle value="everyone">Everyone</Toggle>
                <Toggle value="contacts">My contacts</Toggle>
                <Toggle value="nobody">Nobody at all, not even people in my contacts</Toggle>
              </ToggleGroup>
            </div>,
          );
          const where = `${dir} ${variant} ${size}`;
          const group = container.querySelector("[data-slot=toggle-group]") as HTMLElement;
          expect(group.getBoundingClientRect().width, where).toBeCloseTo(248, 0);
          const toggles = [...container.querySelectorAll<HTMLElement>(".qx-toggle")].map((each) =>
            each.getBoundingClientRect(),
          );
          const widths = toggles.map((box) => box.width);
          expect(Math.max(...widths) - Math.min(...widths), where).toBeLessThanOrEqual(1);
          // In reading order: left to right, or right to left.
          const lefts = toggles.map((box) => box.left);
          expect(lefts, where).toEqual([...lefts].sort((a, b) => (dir === "ltr" ? a - b : b - a)));
          // Each short label centred in its toggle.
          for (const label of [
            ...container.querySelectorAll<HTMLElement>(".qx-toggle-label"),
          ].slice(0, 2)) {
            const box = label.getBoundingClientRect();
            const toggle = (label.closest(".qx-toggle") as HTMLElement).getBoundingClientRect();
            expect(
              Math.abs(box.left + box.width / 2 - (toggle.left + toggle.width / 2)),
              where,
            ).toBeLessThanOrEqual(1);
          }
          // The long one ends in an ellipsis inside its share.
          const long = container.querySelectorAll<HTMLElement>(
            ".qx-toggle-label",
          )[2] as HTMLElement;
          expect(long.scrollWidth, where).toBeGreaterThan(long.clientWidth);
          expect(getComputedStyle(long).textOverflow).toBe("ellipsis");
          const third = toggles[2] as DOMRect;
          expect(long.getBoundingClientRect().right, where).toBeLessThanOrEqual(third.right + 0.5);
          expect(long.getBoundingClientRect().left, where).toBeGreaterThanOrEqual(third.left - 0.5);
          await unmount();
        }
      }
    }
  });

  it("ignores fullWidth in a vertical group, and is its own width without it", async () => {
    const { container } = await render(
      <div style={{ inlineSize: 400 }}>
        <ToggleGroup aria-label="Period">
          <Toggle value="day">Day</Toggle>
          <Toggle value="week">Week</Toggle>
        </ToggleGroup>
        <ToggleGroup fullWidth orientation="vertical" aria-label="Sort">
          <Toggle value="new">Newest</Toggle>
          <Toggle value="old">Oldest</Toggle>
        </ToggleGroup>
      </div>,
    );
    const [inline, vertical] = [
      ...container.querySelectorAll<HTMLElement>("[data-slot=toggle-group]"),
    ];
    expect(inline?.getBoundingClientRect().width).toBeLessThan(200);
    expect(getComputedStyle(vertical as HTMLElement).display).toBe("inline-flex");
    expect(getComputedStyle(vertical as HTMLElement).flexDirection).toBe("column");
  });

  it("looks right as a full-width picker on a 360px column", async () => {
    await page.viewport(360, 240);
    await render(
      <Stage>
        <div style={{ inlineSize: 328 }}>
          <ToggleGroup fullWidth size="sm" defaultValue={["contacts"]} aria-label="Who can add you">
            <Toggle value="everyone">Everyone</Toggle>
            <Toggle value="contacts">My contacts</Toggle>
            <Toggle value="nobody">Nobody</Toggle>
          </ToggleGroup>
        </div>
      </Stage>,
    );
    await screenshotEveryMode("ToggleGroup full width");
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <Inline gap="md">
          <ToggleGroup defaultValue={["grid"]} aria-label="View">
            <Toggle value="grid" icon={LayoutGridIcon} filledWhenPressed>
              Grid
            </Toggle>
            <Toggle value="list" icon={ListIcon}>
              List
            </Toggle>
          </ToggleGroup>
          <ToggleGroup defaultValue={["month"]} aria-label="Period" size="sm">
            <Toggle value="week">Week</Toggle>
            <Toggle value="month">Month</Toggle>
            <Toggle value="year">Year</Toggle>
          </ToggleGroup>
          <ToggleGroup multiple variant="separate" defaultValue={["bold"]} aria-label="Formatting">
            <Toggle value="bold" icon={BoldIcon} aria-label="Bold" />
            <Toggle value="italic" icon={ItalicIcon} aria-label="Italic" />
          </ToggleGroup>
        </Inline>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("Toggle");
  });
});
