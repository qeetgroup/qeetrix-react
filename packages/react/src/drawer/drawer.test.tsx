import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
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
const body = () => document.querySelector("[data-slot=drawer-body]") as HTMLElement;
const header = () => document.querySelector("[data-slot=drawer-header]") as HTMLElement;

/** Read-only details: a long body with nothing focusable in it. */
function DetailsDrawer() {
  return (
    <Drawer defaultOpen>
      <DrawerContent title="Audit event" description="evt_8f2k1" size="sm">
        <DrawerBody>
          {Array.from({ length: 30 }, (_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list
            <p key={index}>Field {index + 1}: unchanged</p>
          ))}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

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

  it("draws its close button in the neutral tone, as a utility icon", async () => {
    await render(<EditDrawer defaultOpen />);
    const close = page.getByRole("button", { name: "Close" });
    await expect.element(close).toHaveAttribute("data-tone", "neutral");
    expect(getComputedStyle(close.element()).color).toBe(tokenColor("--qx-color-text-subtle"));
  });

  it("a scrolling body with nothing focusable takes focus, and scrolls from the keyboard", async () => {
    await page.viewport(800, 480);
    await render(<DetailsDrawer />);
    await expect.poll(() => body().getAttribute("tabindex")).toBe("0");
    // Nothing in the body takes focus, so the drawer opens on the body itself.
    await expect.poll(() => document.activeElement).toBe(body());
    await userEvent.keyboard("{PageDown}");
    await expect.poll(() => body().scrollTop).toBeGreaterThan(0);
    await expectAccessible(document.body);
  });

  it("a body that holds a field stays out of the tab order", async () => {
    await page.viewport(800, 480);
    await render(<EditDrawer defaultOpen />);
    await expect.element(page.getByRole("textbox", { name: "Trade name" })).toHaveFocus();
    expect(body().hasAttribute("tabindex")).toBe(false);
  });

  it("not dismissible: no close button, and neither Escape nor an outside click closes it", async () => {
    await page.viewport(1000, 600);
    await render(<EditDrawer dismissible={false} defaultOpen />);
    const drawer = page.getByRole("dialog", { name: "Edit customer" });
    await expect.element(drawer).toBeVisible();
    expect(document.querySelector("[data-slot=drawer-close]")).toBeNull();
    // Without the close button, the header's text runs to the 24px padding.
    expect(getComputedStyle(header()).paddingInlineEnd).toBe("24px");
    await userEvent.keyboard("{Escape}");
    await expect.element(drawer).toBeVisible();
    await page.elementLocator(document.body).click({ position: { x: 40, y: 300 } });
    await expect.element(drawer).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect.element(drawer).not.toBeInTheDocument();
  });

  it("dismissible by default: room for the close button, and an outside click closes it", async () => {
    await page.viewport(1000, 600);
    await render(<EditDrawer defaultOpen />);
    const drawer = page.getByRole("dialog");
    await expect.element(drawer).toBeVisible();
    expect(getComputedStyle(header()).paddingInlineEnd).toBe("56px");
    await page.elementLocator(document.body).click({ position: { x: 40, y: 300 } });
    await expect.element(drawer).not.toBeInTheDocument();
  });

  it("looks right when not dismissible", async () => {
    await page.viewport(800, 480);
    await render(<EditDrawer dismissible={false} defaultOpen />);
    await expect.element(page.getByRole("dialog")).toBeVisible();
    await expectAccessible(document.body);
    await screenshotSchemes("Drawer · not dismissible", null);
  });

  it("is accessible and looks right in both schemes", async () => {
    await page.viewport(800, 480);
    await render(<EditDrawer defaultOpen />);
    await expect.element(page.getByRole("dialog")).toBeVisible();
    await expectAccessible(document.body);
    await screenshotSchemes("Drawer", null);
  });
});

describe("DrawerFooter's start", () => {
  it("holds a link at the footer's start, the actions staying at its end", async () => {
    await render(
      <Drawer defaultOpen>
        <DrawerContent title="Add people">
          <DrawerBody>Invite by email.</DrawerBody>
          <DrawerFooter start={<a href="#import">Adding many? Import a file</a>}>
            <Button variant="ghost">Cancel</Button>
            <Button>Invite</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>,
    );
    const footer = document.querySelector("[data-slot=drawer-footer]") as HTMLElement;
    const start = footer.querySelector("[data-slot=drawer-footer-start]") as HTMLElement;
    const invite = page.getByRole("button", { name: "Invite" }).element();
    const f = footer.getBoundingClientRect();
    const padding = Number.parseFloat(getComputedStyle(footer).paddingInlineStart);
    expect(Math.round(start.getBoundingClientRect().left - f.left)).toBe(Math.round(padding));
    expect(Math.round(f.right - invite.getBoundingClientRect().right)).toBe(
      Math.round(Number.parseFloat(getComputedStyle(footer).paddingInlineEnd)),
    );
    await expect
      .element(page.getByRole("link", { name: "Adding many? Import a file" }))
      .toBeVisible();
  });
});
