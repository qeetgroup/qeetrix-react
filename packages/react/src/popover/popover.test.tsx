import { afterEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Button } from "../button/button";
import { Checkbox } from "../checkbox/checkbox";
import { Stack } from "../stack/stack";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "./popover";

function FilterPopover({ defaultOpen }: { defaultOpen?: boolean }) {
  return (
    <Popover defaultOpen={defaultOpen}>
      <PopoverTrigger render={<Button variant="soft">Filter</Button>} />
      <PopoverContent title="Filters" description="Show invoices that are:">
        <Stack gap="xs">
          <Checkbox label="Overdue" defaultChecked />
          <Checkbox label="Paid" />
        </Stack>
        <PopoverClose render={<Button size="sm">Apply</Button>} />
      </PopoverContent>
    </Popover>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Popover", () => {
  it("opens from its trigger, labelled by its title, with focus inside", async () => {
    await render(<FilterPopover />);
    await page.getByRole("button", { name: "Filter" }).click();
    const popup = page.getByRole("dialog", { name: "Filters" });
    await expect.element(popup).toBeVisible();
    await expect.element(popup).toHaveAccessibleDescription("Show invoices that are:");
    expect(popup.element().contains(document.activeElement)).toBe(true);
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    await render(<FilterPopover />);
    const trigger = page.getByRole("button", { name: "Filter" });
    await trigger.click();
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog", { name: "Filters" })).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  it("stacks above dialogs", async () => {
    await render(<FilterPopover defaultOpen />);
    const positioner = document.querySelector("[data-slot=popover-positioner]") as HTMLElement;
    expect(positioner.classList).toContain("qx-popover-positioner");
    expect(getComputedStyle(positioner).zIndex).toBe("1500");
  });

  it("without a title, is named by aria-label or aria-labelledby", async () => {
    await render(
      <>
        <Popover defaultOpen>
          <PopoverTrigger render={<Button>Columns</Button>} />
          <PopoverContent aria-label="Visible columns">
            <Checkbox label="Amount" defaultChecked />
          </PopoverContent>
        </Popover>
        <h2 id="share-heading">Share invoice</h2>
        <Popover defaultOpen>
          <PopoverTrigger render={<Button>Share</Button>} />
          <PopoverContent aria-labelledby="share-heading" side="top">
            <Checkbox label="Anyone with the link" />
          </PopoverContent>
        </Popover>
      </>,
    );
    await expect.element(page.getByRole("dialog", { name: "Visible columns" })).toBeVisible();
    await expect.element(page.getByRole("dialog", { name: "Share invoice" })).toBeVisible();
  });

  it("warns in development when it has no name", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await render(<FilterPopover />);
    await render(
      <Popover>
        <PopoverTrigger render={<Button>Columns</Button>} />
        <PopoverContent aria-label="Visible columns" />
      </Popover>,
    );
    expect(warn).not.toHaveBeenCalled();
    await render(
      <Popover>
        <PopoverTrigger render={<Button>Columns</Button>} />
        <PopoverContent />
      </Popover>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("aria-labelledby"));
  });

  it("is accessible and looks right in both schemes", async () => {
    await page.viewport(480, 360);
    await render(<FilterPopover defaultOpen />);
    await expect.element(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
    await expectAccessible(document.body);
    await screenshotSchemes("Popover", null);
  });
});
