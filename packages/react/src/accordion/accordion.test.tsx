import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { settled } from "../../tests/support/settled";
import { Stage } from "../../tests/support/stage";
import { Button } from "../button/button";
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

  it("makes each trigger a Tab stop, as the APG accordion pattern now does", async () => {
    await render(<Advanced />);
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Tab}");
    await expect.element(page.getByRole("button", { name: "Invoice numbering" })).toHaveFocus();
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
});
