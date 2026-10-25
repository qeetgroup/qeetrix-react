/**
 * Right-to-left: arrow keys, positions and layout mirror under QeetrixProvider direction="rtl"
 * (D-13; 06-component-specs.md, Phase 4 close-out). The page's own `dir` is set too, as an app does.
 */

import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "../src/button/button";
import { Drawer, DrawerContent } from "../src/drawer/drawer";
import { Input } from "../src/input/input";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSubmenu,
  MenuSubmenuTrigger,
  MenuTrigger,
} from "../src/menu/menu";
import { QeetrixProvider } from "../src/provider/provider";
import { Radio, RadioGroup } from "../src/radio/radio";
import { Slider } from "../src/slider/slider";
import { Tab, Tabs, TabsList } from "../src/tabs/tabs";
import { Toggle, ToggleGroup } from "../src/toggle/toggle";
import { tab } from "./support/keyboard";

const html = document.documentElement;
beforeEach(() => {
  html.dir = "rtl";
});
afterEach(() => {
  html.removeAttribute("dir");
});

const Rtl = ({ children }: { children: ReactNode }) => (
  <QeetrixProvider direction="rtl">{children}</QeetrixProvider>
);

describe("right-to-left", () => {
  it("Tabs: the left arrow moves to the next tab", async () => {
    await render(
      <Rtl>
        <Tabs defaultValue="a">
          <TabsList>
            <Tab value="a">All</Tab>
            <Tab value="b">Paid</Tab>
          </TabsList>
        </Tabs>
      </Rtl>,
    );
    await tab();
    await userEvent.keyboard("{ArrowLeft}");
    await expect
      .element(page.getByRole("tab", { name: "Paid" }))
      .toHaveAttribute("aria-selected", "true");
  });

  it("ToggleGroup and a horizontal RadioGroup: the left arrow moves on", async () => {
    await render(
      <Rtl>
        <ToggleGroup aria-label="View" defaultValue={["grid"]}>
          <Toggle value="grid">Grid</Toggle>
          <Toggle value="list">List</Toggle>
        </ToggleGroup>
        <RadioGroup label="Cycle" orientation="horizontal" defaultValue="m">
          <Radio value="m" label="Monthly" />
          <Radio value="y" label="Yearly" />
        </RadioGroup>
      </Rtl>,
    );
    await tab();
    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(page.getByRole("button", { name: "List" })).toHaveFocus();
    await tab();
    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(page.getByRole("radio", { name: "Yearly" })).toBeChecked();
  });

  it("Slider: the left arrow increases", async () => {
    await render(
      <Rtl>
        <Slider aria-label="Discount" defaultValue={10} />
      </Rtl>,
    );
    await tab();
    await userEvent.keyboard("{ArrowLeft}");
    await expect
      .element(page.getByRole("slider", { name: "Discount" }))
      .toHaveAttribute("aria-valuenow", "11");
  });

  it("Menu: the left arrow opens a submenu, and the highlight bar sits on the right", async () => {
    await render(
      <Rtl>
        <Menu>
          <MenuTrigger render={<Button>Actions</Button>} />
          <MenuContent>
            <MenuSubmenu>
              <MenuSubmenuTrigger>Export as</MenuSubmenuTrigger>
              <MenuContent>
                <MenuItem>CSV</MenuItem>
              </MenuContent>
            </MenuSubmenu>
          </MenuContent>
        </Menu>
      </Rtl>,
    );
    await page.getByRole("button", { name: "Actions" }).click();
    await userEvent.keyboard("{ArrowDown}");
    const trigger = page.getByRole("menuitem", { name: "Export as" }).element();
    expect(getComputedStyle(trigger, "::before").right).toBe("0px");
    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(page.getByRole("menuitem", { name: "CSV" })).toBeVisible();
  });

  it("Drawer: the end edge is the left", async () => {
    await page.viewport(1000, 600);
    await render(
      <Rtl>
        <Drawer defaultOpen>
          <DrawerContent title="Edit customer" size="sm" />
        </Drawer>
      </Rtl>,
    );
    const popup = () =>
      (document.querySelector("[data-slot=drawer-popup]") as HTMLElement).getBoundingClientRect();
    await expect.poll(() => Math.round(popup().left)).toBe(0);
  });

  it("Input: the start adornment sits on the right", async () => {
    const { container } = await render(
      <Rtl>
        <Input aria-label="Amount" startAdornment="₹" />
      </Rtl>,
    );
    const start = container.querySelector("[data-slot=input-start]") as HTMLElement;
    const control = container.querySelector("[data-slot=input-control]") as HTMLElement;
    expect(start.getBoundingClientRect().left).toBeGreaterThan(
      control.getBoundingClientRect().left,
    );
  });
});
