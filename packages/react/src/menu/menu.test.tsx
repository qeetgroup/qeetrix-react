import { CopyIcon } from "@qeetrix/icons/icons/copy";
import { EllipsisIcon } from "@qeetrix/icons/icons/ellipsis";
import { PencilIcon } from "@qeetrix/icons/icons/pencil";
import { TrashIcon } from "@qeetrix/icons/icons/trash";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { IconButton } from "../button/button";
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSubmenu,
  MenuSubmenuTrigger,
  MenuTrigger,
} from "./menu";

const html = document.documentElement;

function RowMenu({ onEdit, defaultOpen }: { onEdit?: () => void; defaultOpen?: boolean }) {
  return (
    <Menu defaultOpen={defaultOpen}>
      <MenuTrigger
        render={<IconButton icon={EllipsisIcon} aria-label="Invoice actions" tooltip={false} />}
      />
      <MenuContent>
        <MenuItem icon={PencilIcon} onClick={onEdit} shortcut="E">
          Edit
        </MenuItem>
        <MenuItem icon={CopyIcon} shortcut="Ctrl+D">
          Duplicate
        </MenuItem>
        <MenuSubmenu>
          <MenuSubmenuTrigger>Export as</MenuSubmenuTrigger>
          <MenuContent>
            <MenuItem>CSV</MenuItem>
            <MenuItem>PDF</MenuItem>
          </MenuContent>
        </MenuSubmenu>
        <MenuSeparator />
        <MenuGroup>
          <MenuGroupLabel>Columns</MenuGroupLabel>
          <MenuCheckboxItem defaultChecked>Amount</MenuCheckboxItem>
          <MenuCheckboxItem>GSTIN</MenuCheckboxItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuRadioGroup defaultValue="inr">
          <MenuGroupLabel>Currency</MenuGroupLabel>
          <MenuRadioItem value="inr">INR</MenuRadioItem>
          <MenuRadioItem value="usd">USD</MenuRadioItem>
        </MenuRadioGroup>
        <MenuSeparator />
        <MenuItem icon={TrashIcon} tone="danger">
          Delete
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

describe("Menu", () => {
  it("opens from its trigger; arrow keys move and Enter activates", async () => {
    const onEdit = vi.fn();
    await render(<RowMenu onEdit={onEdit} />);
    await page.getByRole("button", { name: "Invoice actions" }).click();
    await expect.element(page.getByRole("menu")).toBeVisible();
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(page.getByRole("menuitem", { name: "Edit" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onEdit).toHaveBeenCalledOnce();
    await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
  });

  it("jumps by typing, and Escape returns focus to the trigger", async () => {
    await render(<RowMenu />);
    const trigger = page.getByRole("button", { name: "Invoice actions" });
    await trigger.click();
    await userEvent.keyboard("du");
    await expect.element(page.getByRole("menuitem", { name: /Duplicate/ })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await expect.element(trigger).toHaveFocus();
  });

  it("marks the highlighted item with a 2px Ember start bar", async () => {
    await render(<RowMenu defaultOpen />);
    const edit = page.getByRole("menuitem", { name: "Edit" });
    await edit.hover();
    await expect.element(edit).toHaveAttribute("data-highlighted");
    const bar = getComputedStyle(edit.element(), "::before");
    expect(bar.width).toBe("2px");
    expect(bar.backgroundColor).toBe(tokenColor("--qx-color-border-brand"));
  });

  it("follows the density: items 28, 32 and 36px", async () => {
    await render(<RowMenu defaultOpen />);
    const item = page.getByRole("menuitem", { name: "Edit" }).element();
    const heights: Record<string, number> = {};
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      heights[density] = item.getBoundingClientRect().height;
    }
    delete html.dataset.qxDensity;
    expect(heights).toEqual({ compact: 28, default: 32, comfortable: 36 });
  });

  it("toggles checkbox items, selects radio items and opens submenus", async () => {
    await render(<RowMenu defaultOpen />);
    const gstin = page.getByRole("menuitemcheckbox", { name: "GSTIN" });
    await gstin.click();
    await expect.element(gstin).toHaveAttribute("aria-checked", "true");
    const usd = page.getByRole("menuitemradio", { name: "USD" });
    await usd.click();
    await expect.element(usd).toHaveAttribute("aria-checked", "true");
    await page.getByRole("menuitem", { name: "Export as" }).hover();
    await expect.element(page.getByRole("menuitem", { name: "PDF" })).toBeVisible();
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(360, 560);
    await render(<RowMenu defaultOpen />);
    await expect.element(page.getByRole("menu")).toBeVisible();
    const del = page.getByRole("menuitem", { name: "Delete" }).element();
    expect(getComputedStyle(del).color).toBe(tokenColor("--qx-color-text-danger"));
    await expectAccessible(document.body);
    await screenshotEveryMode("Menu", null);
  });
});
