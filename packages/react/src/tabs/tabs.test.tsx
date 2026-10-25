import { LayoutGridIcon } from "@qeetrix/icons/icons/layout-grid";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { settled } from "../../tests/support/settled";
import { Stage } from "../../tests/support/stage";
import { Tab, Tabs, TabsList, TabsPanel } from "./tabs";

const html = document.documentElement;

function Invoices({ onValueChange }: { onValueChange?: (value: unknown) => void }) {
  return (
    <Tabs defaultValue="all" onValueChange={onValueChange}>
      <TabsList>
        <Tab value="all" icon={LayoutGridIcon} filledWhenSelected>
          All
        </Tab>
        <Tab value="overdue">Overdue</Tab>
        <Tab value="paid">Paid</Tab>
        <Tab value="void" disabled>
          Void
        </Tab>
      </TabsList>
      <TabsPanel value="all">All invoices</TabsPanel>
      <TabsPanel value="overdue">Overdue invoices</TabsPanel>
      <TabsPanel value="paid">Paid invoices</TabsPanel>
    </Tabs>
  );
}

const indicator = () => document.querySelector("[data-slot=tabs-indicator]") as HTMLElement;

describe("Tabs", () => {
  it("is one tab stop; arrow keys move and select", async () => {
    const onValueChange = vi.fn();
    await render(<Invoices onValueChange={onValueChange} />);
    await userEvent.keyboard("{Tab}");
    await expect.element(page.getByRole("tab", { name: "All" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    const overdue = page.getByRole("tab", { name: "Overdue" });
    await expect.element(overdue).toHaveFocus();
    await expect.element(overdue).toHaveAttribute("aria-selected", "true");
    expect(onValueChange).toHaveBeenLastCalledWith("overdue", expect.anything());
    await expect
      .element(page.getByRole("tabpanel", { name: "Overdue" }))
      .toHaveTextContent("Overdue invoices");
  });

  it("puts the 3px Ember bar under the selected tab, and slides it", async () => {
    await render(<Invoices />);
    await settled();
    const bar = indicator();
    expect(getComputedStyle(bar).height).toBe("3px");
    expect(getComputedStyle(bar).backgroundColor).toBe(tokenColor("--qx-color-border-brand"));
    const under = (name: string) => {
      const tab = page.getByRole("tab", { name }).element().getBoundingClientRect();
      const b = bar.getBoundingClientRect();
      return (
        Math.round(b.left) === Math.round(tab.left) && Math.round(b.width) === Math.round(tab.width)
      );
    };
    expect(under("All")).toBe(true);
    await page.getByRole("tab", { name: "Paid" }).click();
    await settled();
    expect(under("Paid")).toBe(true);
  });

  it("selects with weight 600 and a filled icon", async () => {
    await render(<Invoices />);
    const all = page.getByRole("tab", { name: "All" }).element();
    expect(getComputedStyle(all).fontWeight).toBe("600");
    const filled = all.querySelector(".qx-tab-icon-filled") as SVGElement;
    expect(getComputedStyle(filled).display).toBe("block");
  });

  it("pads 12px at compact density and 16px otherwise", async () => {
    await render(<Invoices />);
    const tab = page.getByRole("tab", { name: "Paid" }).element();
    const padding: Record<string, string> = {};
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      padding[density] = getComputedStyle(tab).paddingLeft;
    }
    delete html.dataset.qxDensity;
    expect(padding).toEqual({ compact: "12px", default: "16px", comfortable: "16px" });
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <div style={{ inlineSize: 360 }}>
          <Invoices />
        </div>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("Tabs");
  });
});
