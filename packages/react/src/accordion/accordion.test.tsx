import { ChevronDownIcon } from "@qeetrix/icons/icons/chevron-down";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { tokenColor } from "../../tests/support/color";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { settled } from "../../tests/support/settled";
import { Stage } from "../../tests/support/stage";
import { Button, IconButton } from "../button/button";
import { Card } from "../card/card";
import {
  Accordion,
  AccordionItem,
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "./accordion";

function Advanced({ onValueChange }: { onValueChange?: (value: unknown) => void }) {
  return (
    <Accordion defaultValue={["tax"]} onValueChange={onValueChange}>
      <AccordionItem value="tax" title="Tax settings">
        GST is added at 18%.
      </AccordionItem>
      <AccordionItem value="numbering" title="Invoice numbering">
        INV-YYYY-NNNN
      </AccordionItem>
      <AccordionItem value="legacy" title="Legacy export" disabled>
        Off.
      </AccordionItem>
    </Accordion>
  );
}

describe("Accordion", () => {
  it("opens one section at a time from its trigger, inside a heading", async () => {
    const onValueChange = vi.fn();
    await render(<Advanced onValueChange={onValueChange} />);
    const numbering = page.getByRole("button", { name: "Invoice numbering" });
    expect(numbering.element().parentElement?.tagName).toBe("H3");
    await numbering.click();
    await expect.element(numbering).toHaveAttribute("aria-expanded", "true");
    await expect
      .element(page.getByRole("button", { name: "Tax settings" }))
      .toHaveAttribute("aria-expanded", "false");
    expect(onValueChange).toHaveBeenLastCalledWith(["numbering"], expect.anything());
  });

  it("turns the chevron and animates the panel to its height", async () => {
    await render(<Advanced />);
    const tax = page.getByRole("button", { name: "Tax settings" }).element();
    expect(getComputedStyle(tax.querySelector("svg") as SVGElement).rotate).toBe("180deg");
    await page.getByRole("button", { name: "Invoice numbering" }).click();
    await settled();
    const panel = document.querySelectorAll("[data-slot=accordion-panel]")[1] as HTMLElement;
    expect(panel.getBoundingClientRect().height).toBeGreaterThan(20);
  });

  it("dims a disabled trigger's chevron with its text (QTRX-167)", async () => {
    await render(<Advanced />);
    const chevron = (name: string) =>
      page.getByRole("button", { name }).element().querySelector("svg") as SVGElement;
    expect(getComputedStyle(chevron("Legacy export")).color).toBe(
      tokenColor("--qx-color-icon-disabled"),
    );
    expect(getComputedStyle(chevron("Tax settings")).color).toBe(
      tokenColor("--qx-color-icon-subtle"),
    );
  });

  it("makes each trigger a Tab stop, as the APG accordion pattern now does", async () => {
    await render(<Advanced />);
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Tab}");
    await expect.element(page.getByRole("button", { name: "Invoice numbering" })).toHaveFocus();
  });

  it("sets body text in its panel, as Card's body does, on a page without a body font", async () => {
    // No Stage: nothing above sets a font, so the panel can't inherit one.
    const { container } = await render(
      <>
        <Advanced />
        <Card>Card body</Card>
      </>,
    );
    const content = container.querySelector("[data-slot=accordion-content]") as HTMLElement;
    const body = container.querySelector("[data-slot=card-body]") as HTMLElement;
    const panel = getComputedStyle(content);
    const card = getComputedStyle(body);
    expect(panel.fontSize).toBe("14px");
    expect(Number.parseFloat(panel.lineHeight)).toBeCloseTo(20, 2);
    expect(panel.fontFamily).toMatch(/Qeet Sans/);
    expect(panel.fontVariationSettings).toBe('"GEOM" 0');
    expect(panel.color).toBe(tokenColor("--qx-color-text-default"));
    for (const property of [
      "fontFamily",
      "fontSize",
      "lineHeight",
      "fontWeight",
      "fontVariationSettings",
    ] as const) {
      expect(panel[property], property).toBe(card[property]);
    }
  });

  it("marks its heading wrapper and content with slots", async () => {
    const { container } = await render(<Advanced />);
    const headers = container.querySelectorAll("[data-slot=accordion-header]");
    expect(headers).toHaveLength(3);
    expect(headers[0]?.tagName).toBe("H3");
    // Closed panels stay in the page for find in page (hiddenUntilFound).
    expect(container.querySelectorAll("[data-slot=accordion-content]")).toHaveLength(3);
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <div style={{ inlineSize: 360 }}>
          <Advanced />
        </div>
      </Stage>,
    );
    await settled();
    await expectAccessible(container);
    await screenshotEveryMode("Accordion");
  });
});

describe("Collapsible", () => {
  it("marks its root and its trigger with slots", async () => {
    const { container } = await render(
      <Collapsible>
        <CollapsibleTrigger>Advanced options</CollapsibleTrigger>
        <CollapsiblePanel>Webhook signing secret</CollapsiblePanel>
      </Collapsible>,
    );
    expect(container.querySelector("[data-slot=collapsible]")).not.toBeNull();
    expect(
      page.getByRole("button", { name: "Advanced options" }).element().getAttribute("data-slot"),
    ).toBe("collapsible-trigger");
  });

  it("shows and hides its panel from your trigger", async () => {
    await render(
      <Collapsible>
        <CollapsibleTrigger render={<Button variant="ghost">Show more</Button>} />
        <CollapsiblePanel>Bank: HDFC, IFSC HDFC0000001</CollapsiblePanel>
      </Collapsible>,
    );
    const trigger = page.getByRole("button", { name: "Show more" });
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await expect.element(page.getByText("Bank: HDFC, IFSC HDFC0000001")).toBeVisible();
  });

  // QTRX-81: open and closed look different, as an AccordionItem's do.
  it("turns the chevron of the Button it renders as the panel opens, and back as it closes", async () => {
    await render(
      <Collapsible>
        <CollapsibleTrigger
          render={
            <Button variant="ghost" icon={ChevronDownIcon}>
              Advanced options
            </Button>
          }
        />
        <CollapsiblePanel>Webhook signing secret</CollapsiblePanel>
      </Collapsible>,
    );
    const trigger = page.getByRole("button", { name: "Advanced options" });
    const icon = () => trigger.element().querySelector("[data-slot=button-icon]") as SVGElement;
    expect(trigger.element().getAttribute("data-slot")).toBe("button");
    expect(getComputedStyle(icon()).rotate).toBe("none");
    expect(getComputedStyle(icon()).transitionProperty).toBe("rotate");
    await trigger.click();
    await expect.poll(() => getComputedStyle(icon()).rotate).toBe("180deg");
    await trigger.click();
    await expect.poll(() => getComputedStyle(icon()).rotate).toBe("none");
  });

  it("turns an IconButton's chevron too", async () => {
    await render(
      <Collapsible>
        <CollapsibleTrigger
          render={<IconButton icon={ChevronDownIcon} aria-label="Show details" tooltip={false} />}
        />
        <CollapsiblePanel>Details</CollapsiblePanel>
      </Collapsible>,
    );
    const trigger = page.getByRole("button", { name: "Show details" });
    await trigger.click();
    const icon = trigger.element().querySelector("svg") as SVGElement;
    await expect.poll(() => getComputedStyle(icon).rotate).toBe("180deg");
  });

  it("leaves a Button's chevron alone outside a Collapsible", async () => {
    await render(
      <Button variant="ghost" icon={ChevronDownIcon} data-panel-open="">
        More
      </Button>,
    );
    const icon = page
      .getByRole("button", { name: "More" })
      .element()
      .querySelector("svg") as SVGElement;
    expect(getComputedStyle(icon).rotate).toBe("none");
  });
});
