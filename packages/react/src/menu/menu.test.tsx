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
import { Button, IconButton } from "../button/button";
import {
  ContextMenu,
  ContextMenuTrigger,
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

function VisibilityMenu() {
  return (
    <Menu defaultOpen>
      <MenuTrigger render={<Button variant="soft">Share</Button>} />
      <MenuContent>
        <MenuRadioGroup defaultValue="team">
          <MenuGroupLabel>Who can see it</MenuGroupLabel>
          <MenuRadioItem value="private" description="Only you">
            Private
          </MenuRadioItem>
          <MenuRadioItem value="team" description="Everyone in Finance">
            Team
          </MenuRadioItem>
        </MenuRadioGroup>
        <MenuSeparator />
        <MenuItem icon={CopyIcon} shortcut="Ctrl+L" description="Anyone with the link can view it">
          Copy link
        </MenuItem>
        <MenuItem icon={PencilIcon} shortcut="E">
          Edit
        </MenuItem>
        <MenuItem icon={TrashIcon} tone="danger" description="It can't be undone" disabled>
          Delete
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

function InvoiceRow({ onEdit }: { onEdit?: () => void }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger style={{ padding: 48 }}>
        <Button variant="ghost">INV-2026-0042</Button>
      </ContextMenuTrigger>
      <MenuContent>
        <MenuItem icon={PencilIcon} onClick={onEdit}>
          Edit
        </MenuItem>
        <MenuItem icon={CopyIcon}>Duplicate</MenuItem>
        <MenuSeparator />
        <MenuItem icon={TrashIcon} tone="danger">
          Delete
        </MenuItem>
      </MenuContent>
    </ContextMenu>
  );
}

const box = (element: Element) => element.getBoundingClientRect();
const middle = (element: Element) => box(element).top + box(element).height / 2;

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
    await render(<RowMenu />);
    await page.getByRole("button", { name: "Invoice actions" }).click();
    await userEvent.keyboard("{ArrowDown}");
    const edit = page.getByRole("menuitem", { name: "Edit" });
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

  it("names its positioner and every part of an item", async () => {
    await render(<RowMenu defaultOpen />);
    await expect.element(page.getByRole("menu")).toBeVisible();
    expect(document.querySelector("[data-slot=menu-positioner]")?.classList).toContain(
      "qx-menu-positioner",
    );
    const edit = page.getByRole("menuitem", { name: "Edit" }).element();
    expect(edit.querySelector("[data-slot=menu-item-icon]")?.classList).toContain(
      "qx-menu-item-icon",
    );
    expect(edit.querySelector("[data-slot=menu-item-label]")?.textContent).toBe("Edit");
    const amount = page.getByRole("menuitemcheckbox", { name: "Amount" }).element();
    expect(amount.querySelector("[data-slot=menu-item-mark]")).not.toBeNull();
    const exportAs = page.getByRole("menuitem", { name: "Export as" }).element();
    expect(exportAs.querySelector("[data-slot=menu-submenu-icon]")).not.toBeNull();
  });

  it("description: a subtle second line that describes the item, which the label names", async () => {
    await render(<VisibilityMenu />);
    const link = page.getByRole("menuitem", { name: "Copy link" });
    await expect.element(link).toHaveAccessibleDescription("Anyone with the link can view it");
    await expect
      .element(page.getByRole("menuitemradio", { name: "Team" }))
      .toHaveAccessibleDescription("Everyone in Finance");
    const description = link.element().querySelector("[data-slot=menu-item-description]");
    expect(getComputedStyle(description as Element).color).toBe(
      tokenColor("--qx-color-text-subtle"),
    );
    const disabled = page.getByRole("menuitem", { name: "Delete" }).element();
    expect(
      getComputedStyle(disabled.querySelector("[data-slot=menu-item-description]") as Element)
        .color,
    ).toBe(tokenColor("--qx-color-text-disabled"));
    // Typing matches the label, not the description.
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("co");
    await expect.element(link).toHaveFocus();
  });

  it("description: the label keeps a plain item's line, with the icon, mark and shortcut on it, at every density", async () => {
    await render(<VisibilityMenu />);
    const link = page.getByRole("menuitem", { name: "Copy link" }).element();
    const edit = page.getByRole("menuitem", { name: "Edit" }).element();
    const team = page.getByRole("menuitemradio", { name: "Team" }).element();
    const part = (item: Element, name: string) =>
      item.querySelector(`[data-slot=${name}]`) as Element;
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      const label = part(link, "menu-item-label");
      // The label sits as far from the item's top as a plain item's label does.
      expect(box(label).top - box(link).top).toBeCloseTo(
        box(part(edit, "menu-item-label")).top - box(edit).top,
        1,
      );
      // Icon, shortcut and radio mark are centred on the label's line, not on both lines.
      expect(Math.abs(middle(part(link, "menu-item-icon")) - middle(label))).toBeLessThanOrEqual(
        0.5,
      );
      expect(Math.abs(middle(part(link, "menu-shortcut")) - middle(label))).toBeLessThanOrEqual(
        0.5,
      );
      const teamLabel = part(team, "menu-item-label");
      expect(
        Math.abs(middle(part(team, "menu-item-mark")) - middle(teamLabel)),
      ).toBeLessThanOrEqual(0.5);
      // The description sits right under the label, and the item grows to hold both lines.
      expect(box(part(link, "menu-item-description")).top).toBe(box(label).bottom);
      expect(box(link).bottom - box(part(link, "menu-item-description")).bottom).toBeCloseTo(
        box(label).top - box(link).top,
        1,
      );
    }
    delete html.dataset.qxDensity;
  });

  it("description: accessible and right in every mode", async () => {
    await page.viewport(360, 400);
    await render(<VisibilityMenu />);
    await expect.element(page.getByRole("menu")).toBeVisible();
    await expectAccessible(document.body);
    await screenshotEveryMode("Menu · descriptions", null);
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

describe("ContextMenu", () => {
  it("opens at the pointer on right-click, its first item level with the pointer", async () => {
    await page.viewport(800, 600);
    await render(<InvoiceRow />);
    const row = page.getByRole("button", { name: "INV-2026-0042" });
    // Read before it opens: the open menu hides the page from assistive technology.
    const pointer = { x: box(row.element()).left + 20, y: box(row.element()).top + 12 };
    await row.click({ button: "right", position: { x: 20, y: 12 } });
    const menu = page.getByRole("menu");
    await expect.element(menu).toBeVisible();
    const first = page.getByRole("menuitem", { name: "Edit" }).element();
    await expect.poll(() => Math.round(box(first).top)).toBe(Math.round(pointer.y));
    expect(box(menu.element()).left).toBeGreaterThan(pointer.x);
    expect(box(menu.element()).left - pointer.x).toBeLessThanOrEqual(4);
    await userEvent.keyboard("{Escape}");
    await expect.element(menu).not.toBeInTheDocument();
  });

  it("opens from the keyboard with Shift+F10, at the focused element", async () => {
    const onEdit = vi.fn();
    await render(<InvoiceRow onEdit={onEdit} />);
    const row = page.getByRole("button", { name: "INV-2026-0042" });
    await userEvent.keyboard("{Tab}");
    await expect.element(row).toHaveFocus();
    const centre = box(row.element()).top + box(row.element()).height / 2;
    await userEvent.keyboard("{Shift>}{F10}{/Shift}");
    const menu = page.getByRole("menu");
    await expect.element(menu).toBeVisible();
    await expect.poll(() => menu.element().contains(document.activeElement)).toBe(true);
    // Opened once, from the focused element's centre.
    expect(document.querySelectorAll("[data-slot=menu-popup]")).toHaveLength(1);
    const edit = page.getByRole("menuitem", { name: "Edit" }).element();
    // Polled: the menu slides 4px in as it opens.
    await expect.poll(() => Math.round(box(edit).top)).toBe(Math.round(centre));
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(page.getByRole("menuitem", { name: "Edit" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onEdit).toHaveBeenCalledOnce();
    await expect.element(menu).not.toBeInTheDocument();
  });

  it("opens with the context menu key, and Escape returns focus to where it was", async () => {
    await render(<InvoiceRow />);
    const row = page.getByRole("button", { name: "INV-2026-0042" });
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{ContextMenu}");
    const menu = page.getByRole("menu");
    await expect.element(menu).toBeVisible();
    expect(document.querySelectorAll("[data-slot=menu-popup]")).toHaveLength(1);
    await userEvent.keyboard("{Escape}");
    await expect.element(menu).not.toBeInTheDocument();
    await expect.element(row).toHaveFocus();
  });

  it("names its trigger area", async () => {
    const { container } = await render(<InvoiceRow />);
    const area = container.querySelector("[data-slot=context-menu-trigger]") as HTMLElement;
    expect(area.classList).toContain("qx-context-menu-trigger");
  });

  it("is accessible and looks right in every mode", async () => {
    await page.viewport(360, 320);
    await render(<InvoiceRow />);
    await page
      .getByRole("button", { name: "INV-2026-0042" })
      .click({ button: "right", position: { x: 20, y: 12 } });
    await expect.element(page.getByRole("menu")).toBeVisible();
    await expectAccessible(document.body);
    await screenshotEveryMode("Menu · context", null);
  });
});
