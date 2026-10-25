import { BoldIcon } from "@qeetrix/icons/icons/bold";
import { ItalicIcon } from "@qeetrix/icons/icons/italic";
import { LayoutGridIcon } from "@qeetrix/icons/icons/layout-grid";
import { ListIcon } from "@qeetrix/icons/icons/list";
import { afterEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
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
