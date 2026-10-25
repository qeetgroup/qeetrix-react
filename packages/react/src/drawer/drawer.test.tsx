import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotSchemes } from "../../tests/support/screenshots";
import { Button } from "../button/button";
import { Stack } from "../stack/stack";
import { TextField } from "../text-field/text-field";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  type DrawerProps,
  DrawerTrigger,
} from "./drawer";

function EditDrawer(props: Omit<DrawerProps, "children">) {
  return (
    <Drawer {...props}>
      <DrawerTrigger render={<Button>Edit customer</Button>} />
      <DrawerContent title="Edit customer" description="Acme Pvt Ltd" size="sm">
        <DrawerBody>
          <Stack gap="lg">
            <TextField label="Trade name" defaultValue="Acme" />
            <TextField label="GSTIN" defaultValue="29ABCDE1234F1Z5" />
          </Stack>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose render={<Button variant="ghost">Cancel</Button>} />
          <Button>Save</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

const popupBox = () =>
  (document.querySelector("[data-slot=drawer-popup]") as HTMLElement).getBoundingClientRect();

describe("Drawer", () => {
  it("opens at the end edge, labelled, with focus on the first field", async () => {
    await page.viewport(1000, 600);
    await render(<EditDrawer />);
    await page.getByRole("button", { name: "Edit customer" }).click();
    await expect.element(page.getByRole("dialog", { name: "Edit customer" })).toBeVisible();
    await expect.element(page.getByRole("textbox", { name: "Trade name" })).toHaveFocus();
    await expect.poll(() => Math.round(popupBox().right)).toBe(1000);
    expect(popupBox().width).toBe(400);
  });

  it("opens at the start edge when asked", async () => {
    await page.viewport(1000, 600);
    await render(<EditDrawer side="start" defaultOpen />);
    await expect.poll(() => Math.round(popupBox().left)).toBe(0);
  });

  it("closes on Escape and returns focus to its trigger", async () => {
    await render(<EditDrawer />);
    const trigger = page.getByRole("button", { name: "Edit customer" });
    await trigger.click();
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  it("is accessible and looks right in both schemes", async () => {
    await page.viewport(800, 480);
    await render(<EditDrawer defaultOpen />);
    await expect.element(page.getByRole("dialog")).toBeVisible();
    await expectAccessible(document.body);
    await screenshotSchemes("Drawer", null);
  });
});
