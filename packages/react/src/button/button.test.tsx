import { ArrowRightIcon } from "@qeetrix/icons/icons/arrow-right";
import { DownloadIcon } from "@qeetrix/icons/icons/download";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { Stage } from "../../tests/support/stage";
import { Inline } from "../inline/inline";
import { Stack } from "../stack/stack";
import { Button, IconButton } from "./button";

const html = document.documentElement;

describe("Button", () => {
  it("follows the density: 28, 32 and 36px at md", async () => {
    await render(<Button>Save</Button>);
    const button = page.getByRole("button", { name: "Save" }).element() as HTMLElement;
    const heights: Record<string, number> = {};
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      heights[density] = button.getBoundingClientRect().height;
    }
    delete html.dataset.qxDensity;
    expect(heights).toEqual({ compact: 28, default: 32, comfortable: 36 });
  });

  it("puts the label first and a sharp icon last", async () => {
    const { container } = await render(<Button icon={ArrowRightIcon}>Continue</Button>);
    const label = container.querySelector("[data-slot=button-label]") as HTMLElement;
    const icon = container.querySelector("[data-slot=button-icon]") as SVGElement;
    expect(icon.getBoundingClientRect().left).toBeGreaterThan(label.getBoundingClientRect().right);
    expect(icon.getAttribute("stroke-linecap")).toBe("square");
    expect(icon.getAttribute("aria-hidden")).toBe("true");
  });

  it("shows the Ember focus frame on keyboard focus", async () => {
    await render(<Button>Save</Button>);
    await userEvent.keyboard("{Tab}");
    const button = page.getByRole("button", { name: "Save" });
    await expect.element(button).toHaveFocus();
    const style = getComputedStyle(button.element());
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("2px");
  });

  it("stays focusable when disabled, and ignores clicks", async () => {
    const onClick = vi.fn();
    await render(
      <Button disabled onClick={onClick}>
        Delete
      </Button>,
    );
    const button = page.getByRole("button", { name: "Delete" });
    await expect.element(button).toHaveAttribute("aria-disabled", "true");
    await userEvent.keyboard("{Tab}");
    await expect.element(button).toHaveFocus();
    await button.click({ force: true });
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is busy while loading: spinner replaces the icon, width stays, clicks are ignored", async () => {
    const onClick = vi.fn();
    const screen = await render(
      <Button icon={ArrowRightIcon} onClick={onClick}>
        Pay ₹1,24,500
      </Button>,
    );
    const button = page.getByRole("button", { name: /Pay/ });
    const before = button.element().getBoundingClientRect().width;
    await screen.rerender(
      <Button icon={ArrowRightIcon} onClick={onClick} loading>
        Pay ₹1,24,500
      </Button>,
    );
    await expect.element(button).toHaveAttribute("aria-busy", "true");
    expect(screen.container.querySelector("[data-slot=spinner]")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(button.element().getBoundingClientRect().width).toBe(before);
    await button.click({ force: true });
    expect(onClick).not.toHaveBeenCalled();
  });

  it("loading: the spinner carries button-spinner and sits where the icon was, at every density", async () => {
    const centre = (element: Element) => {
      const box = element.getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    };
    const screen = await render(
      <Inline gap="sm">
        <Button icon={ArrowRightIcon}>Pay</Button>
        <IconButton icon={DownloadIcon} aria-label="Download" tooltip={false} />
        <Button size="lg" icon={ArrowRightIcon}>
          Pay now
        </Button>
      </Inline>,
    );
    const icons: Record<string, { x: number; y: number }[]> = {};
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      icons[density] = [...screen.container.querySelectorAll("[data-slot=button-icon]")].map(
        centre,
      );
    }
    await screen.rerender(
      <Inline gap="sm">
        <Button icon={ArrowRightIcon} loading>
          Pay
        </Button>
        <IconButton icon={DownloadIcon} aria-label="Download" tooltip={false} loading />
        <Button size="lg" icon={ArrowRightIcon} loading>
          Pay now
        </Button>
      </Inline>,
    );
    const spinners = [...screen.container.querySelectorAll("[data-slot=button-spinner]")];
    expect(spinners).toHaveLength(3);
    for (const spinner of spinners) {
      // Spinner keeps its own slot inside the button's.
      expect(spinner.querySelector(":scope > [data-slot=spinner]")).not.toBeNull();
    }
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      const spun = spinners.map((spinner) => centre(spinner.firstElementChild as Element));
      spun.forEach((at, index) => {
        expect(Math.abs(at.x - (icons[density]?.[index]?.x ?? Number.NaN))).toBeLessThanOrEqual(
          0.5,
        );
        expect(Math.abs(at.y - (icons[density]?.[index]?.y ?? Number.NaN))).toBeLessThanOrEqual(
          0.5,
        );
      });
    }
    delete html.dataset.qxDensity;
  });

  it("IconButton is square and named by its aria-label", async () => {
    await render(<IconButton icon={DownloadIcon} aria-label="Download invoice" />);
    const button = page.getByRole("button", { name: "Download invoice" }).element() as HTMLElement;
    const { width, height } = button.getBoundingClientRect();
    expect(width).toBe(height);
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <Stack gap="md">
          <Inline gap="sm">
            <Button icon={ArrowRightIcon}>Create invoice</Button>
            <Button variant="soft">Export</Button>
            <Button variant="ghost">Cancel</Button>
            <Button tone="danger">Delete</Button>
          </Inline>
          <Inline gap="sm">
            <Button size="sm">Small</Button>
            <Button>Medium</Button>
            <Button size="lg" icon={ArrowRightIcon}>
              Large
            </Button>
            <Button disabled>Disabled</Button>
            <Button loading icon={ArrowRightIcon}>
              Saving
            </Button>
            <IconButton icon={DownloadIcon} aria-label="Download" variant="soft" />
            <IconButton icon={DownloadIcon} aria-label="Download again" />
          </Inline>
        </Stack>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("Button");
  });
});
