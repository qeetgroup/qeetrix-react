/**
 * Selection and disclosure on the server: the chosen value, the selected tab's panel and the open
 * accordion section are in the HTML, so the page reads right before hydration.
 */
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Accordion,
  AccordionItem,
  ScrollArea,
  Select,
  Slider,
  Tab,
  Tabs,
  TabsList,
  TabsPanel,
} from "../src/index";

const html = (node: React.ReactElement) => renderToString(node);

describe("selection and disclosure render on the server", () => {
  it("Select shows its chosen label in a closed trigger", () => {
    const out = html(
      <Select
        aria-label="Billing cycle"
        items={[{ value: "monthly", label: "Monthly" }]}
        defaultValue="monthly"
      />,
    );
    expect(out).toContain('role="combobox"');
    expect(out).toContain("Monthly");
    expect(out).not.toContain('role="listbox"');
  });

  it("Tabs render the selected panel", () => {
    const out = html(
      <Tabs defaultValue="paid">
        <TabsList>
          <Tab value="all">All</Tab>
          <Tab value="paid">Paid</Tab>
        </TabsList>
        <TabsPanel value="all">All invoices</TabsPanel>
        <TabsPanel value="paid">Paid invoices</TabsPanel>
      </Tabs>,
    );
    // The label sits in its own part, which a trailing count shares a baseline with.
    expect(out).toMatch(/aria-selected="true"[^>]*><span[^>]*data-slot="tab-label">Paid/);
    expect(out).toContain("Paid invoices");
  });

  it("Accordion renders headings and the open section", () => {
    const out = html(
      <Accordion defaultValue={["tax"]}>
        <AccordionItem value="tax" title="Tax settings" headingLevel={2}>
          GST is added at 18%.
        </AccordionItem>
      </Accordion>,
    );
    expect(out).toMatch(/<h2[^>]*><button/);
    expect(out).toContain("GST is added at 18%.");
  });

  it("Slider renders a range input per thumb, and ScrollArea its viewport", () => {
    expect(
      html(<Slider aria-label="Amount" defaultValue={[10, 90]} />).match(/type="range"/g),
    ).toHaveLength(2);
    expect(html(<ScrollArea>rows</ScrollArea>)).toContain('data-slot="scroll-area-viewport"');
  });

  it("ScrollArea names its viewport, a region, not its root", () => {
    const out = html(<ScrollArea aria-label="Activity">rows</ScrollArea>);
    const viewport = out.match(/<div[^>]*data-slot="scroll-area-viewport"[^>]*>/)?.[0] ?? "";
    expect(viewport).toContain('role="region"');
    expect(viewport).toContain('aria-label="Activity"');
    expect(out.match(/aria-label=/g)).toHaveLength(1);
  });
});
