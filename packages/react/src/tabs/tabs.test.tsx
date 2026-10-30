import { LayoutGridIcon } from "@qeetrix/icons/icons/layout-grid";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../tests/support/axe";
import { baseline } from "../../tests/support/baseline";
import { tokenColor } from "../../tests/support/color";
import { screenshotEveryMode } from "../../tests/support/screenshots";
import { settled } from "../../tests/support/settled";
import { Stage } from "../../tests/support/stage";
import { Badge } from "../badge/badge";
import { hi } from "../locales/hi";
import { QeetrixProvider } from "../provider/provider";
import { Tab, TabNav, TabNavLink, Tabs, TabsList, TabsPanel, type TabsVariant } from "./tabs";

const html = document.documentElement;

function Invoices({
  onValueChange,
  variant,
}: {
  onValueChange?: (value: unknown) => void;
  variant?: TabsVariant;
}) {
  return (
    <Tabs defaultValue="all" onValueChange={onValueChange}>
      <TabsList variant={variant ?? "line"}>
        <Tab value="all" icon={LayoutGridIcon} filledWhenSelected>
          All
        </Tab>
        <Tab value="overdue">Overdue</Tab>
        <Tab value="paid">Paid</Tab>
        <Tab value="void" disabled>
          Void
        </Tab>
      </TabsList>
      <TabsPanel value="all">All invoices</TabsPanel>
      <TabsPanel value="overdue">Overdue invoices</TabsPanel>
      <TabsPanel value="paid">Paid invoices</TabsPanel>
    </Tabs>
  );
}

const indicator = () => document.querySelector("[data-slot=tabs-indicator]") as HTMLElement;

describe("Tabs", () => {
  it("is one tab stop; arrow keys move and select", async () => {
    const onValueChange = vi.fn();
    await render(<Invoices onValueChange={onValueChange} />);
    await userEvent.keyboard("{Tab}");
    await expect.element(page.getByRole("tab", { name: "All" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    const overdue = page.getByRole("tab", { name: "Overdue" });
    await expect.element(overdue).toHaveFocus();
    await expect.element(overdue).toHaveAttribute("aria-selected", "true");
    expect(onValueChange).toHaveBeenLastCalledWith("overdue", expect.anything());
    await expect
      .element(page.getByRole("tabpanel", { name: "Overdue" }))
      .toHaveTextContent("Overdue invoices");
  });

  it("puts the 3px Ember bar under the selected tab, and slides it", async () => {
    await render(<Invoices />);
    await settled();
    const bar = indicator();
    expect(getComputedStyle(bar).height).toBe("3px");
    expect(getComputedStyle(bar).backgroundColor).toBe(tokenColor("--qx-color-border-brand"));
    const under = (name: string) => {
      const tab = page.getByRole("tab", { name }).element().getBoundingClientRect();
      const b = bar.getBoundingClientRect();
      return (
        Math.round(b.left) === Math.round(tab.left) && Math.round(b.width) === Math.round(tab.width)
      );
    };
    expect(under("All")).toBe(true);
    await page.getByRole("tab", { name: "Paid" }).click();
    await settled();
    expect(under("Paid")).toBe(true);
  });

  it("marks the selected tab with the Ember bar before the indicator is measured", async () => {
    await render(<Invoices />);
    await settled();
    const bar = indicator();
    const selected = page.getByRole("tab", { name: "All" }).element();
    expect(getComputedStyle(selected).boxShadow).toBe("none");
    // As on the server, or before hydration: Base UI keeps the indicator hidden until it measures.
    bar.hidden = true;
    expect(getComputedStyle(bar).display).toBe("none");
    const shadow = getComputedStyle(selected).boxShadow;
    expect(shadow).toContain(tokenColor("--qx-color-border-brand"));
    expect(shadow).toMatch(/inset$|^inset/);
    expect(shadow).toContain("-3px");
    bar.hidden = false;
  });

  it("selects with weight 600 and a filled icon", async () => {
    await render(<Invoices />);
    const all = page.getByRole("tab", { name: "All" }).element();
    expect(getComputedStyle(all).fontWeight).toBe("600");
    const filled = all.querySelector(".qx-tab-icon-filled") as SVGElement;
    expect(getComputedStyle(filled).display).toBe("block");
  });

  it("fills the selected tab's icon by default, and keeps the outline when asked (QTRX-168)", async () => {
    await render(
      <Tabs defaultValue="all">
        <TabsList>
          <Tab value="all" icon={LayoutGridIcon}>
            All
          </Tab>
          <Tab value="paid" icon={LayoutGridIcon} filledWhenSelected={false}>
            Paid
          </Tab>
        </TabsList>
      </Tabs>,
    );
    const shown = (name: string) =>
      [...page.getByRole("tab", { name }).element().querySelectorAll("svg")]
        .filter((svg) => getComputedStyle(svg).display !== "none")
        .map((svg) => svg.getAttribute("class"));
    expect(shown("All")).toEqual(["qx-tab-icon qx-tab-icon-filled"]);
    await page.getByRole("tab", { name: "Paid" }).click();
    expect(shown("Paid")).toEqual(["qx-tab-icon qx-tab-icon-outline"]);
    expect(shown("All")).toEqual(["qx-tab-icon qx-tab-icon-outline"]);
  });

  it("fills the current TabNavLink's icon by default (QTRX-168)", async () => {
    await render(
      <TabNav aria-label="Users views">
        <TabNavLink href="#all" icon={LayoutGridIcon} current>
          All
        </TabNavLink>
      </TabNav>,
    );
    const link = page.getByRole("link", { name: "All" }).element();
    const filled = link.querySelector(".qx-tab-icon-filled") as SVGElement;
    expect(getComputedStyle(filled).display).toBe("block");
  });

  it("pads 12px at compact density and 16px otherwise", async () => {
    await render(<Invoices />);
    const tab = page.getByRole("tab", { name: "Paid" }).element();
    const padding: Record<string, string> = {};
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      padding[density] = getComputedStyle(tab).paddingLeft;
    }
    delete html.dataset.qxDensity;
    expect(padding).toEqual({ compact: "12px", default: "16px", comfortable: "16px" });
  });

  it("shows a count after the label, on its baseline, at every density", async () => {
    await render(
      <Tabs defaultValue="all">
        <TabsList>
          <Tab value="all" badge={1284}>
            All users
          </Tab>
          <Tab value="invited" badge={<Badge tone="warning">9</Badge>}>
            Invitations
          </Tab>
          <Tab value="blocked">
            Blocked <Badge>3</Badge>
          </Tab>
        </TabsList>
      </Tabs>,
    );
    await expect.element(page.getByRole("tab", { name: "All users 1,284" })).toBeVisible();
    const tabs = [...document.querySelectorAll<HTMLElement>("[data-slot=tab]")];
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      for (const tab of tabs) {
        const label = tab.querySelector("[data-slot=tab-label]") as HTMLElement;
        const count = tab.querySelector("[data-slot=badge-label]");
        expect(
          Math.abs(baseline(count) - baseline(label)),
          `${tab.textContent}, ${density}`,
        ).toBeLessThanOrEqual(0.5);
      }
      // With the badge prop, the label stays centred on the tab.
      for (const tab of tabs.slice(0, 2)) {
        const box = tab.getBoundingClientRect();
        const text = (
          tab.querySelector("[data-slot=tab-label]") as HTMLElement
        ).getBoundingClientRect();
        expect(
          Math.abs(text.top + text.height / 2 - (box.top + box.height / 2)),
        ).toBeLessThanOrEqual(0.5);
      }
    }
    delete html.dataset.qxDensity;
  });

  it("formats a count for QeetrixProvider's locale", async () => {
    await render(
      <QeetrixProvider locale="hi-IN" messages={hi}>
        <Tabs defaultValue="all">
          <TabsList>
            <Tab value="all" badge={128400}>
              सभी
            </Tab>
          </TabsList>
        </Tabs>
      </QeetrixProvider>,
    );
    expect(document.querySelector("[data-slot=tab-badge]")?.textContent).toBe("1,28,400");
  });

  it("contained: a joined strip on the neutral fill, the selected segment on the page", async () => {
    await render(<Invoices variant="contained" />);
    await settled();
    const list = document.querySelector("[data-slot=tabs-list]") as HTMLElement;
    expect(list.dataset.variant).toBe("contained");
    const style = getComputedStyle(list);
    expect(style.borderTopWidth).toBe("1px");
    expect(style.borderTopLeftRadius).toBe("4px");
    expect(style.backgroundColor).toBe(tokenColor("--qx-color-bg-neutral-subtle"));
    expect(style.boxShadow).toBe("none");
    const all = page.getByRole("tab", { name: "All" }).element() as HTMLElement;
    const paid = page.getByRole("tab", { name: "Paid" }).element() as HTMLElement;
    expect(getComputedStyle(all).backgroundColor).toBe(tokenColor("--qx-color-surface-default"));
    expect(getComputedStyle(paid).borderInlineStartWidth).toBe("1px");
    // The strip is as tall as a line tab, at every density; the bar sits on its inner foot.
    for (const density of ["compact", "default", "comfortable"]) {
      html.dataset.qxDensity = density;
      const control = Number.parseFloat(
        getComputedStyle(html).getPropertyValue("--qx-size-control-lg"),
      );
      expect(list.getBoundingClientRect().height, density).toBe(control * 16);
    }
    delete html.dataset.qxDensity;
    const bar = indicator().getBoundingClientRect();
    expect(Math.round(bar.bottom)).toBe(Math.round(list.getBoundingClientRect().bottom - 1));
    expect(Math.round(bar.left)).toBe(Math.round(all.getBoundingClientRect().left));
    await paid.click();
    await settled();
    expect(Math.round(indicator().getBoundingClientRect().left)).toBe(
      Math.round(paid.getBoundingClientRect().left),
    );
  });

  it("contained is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <div style={{ inlineSize: 360 }}>
          <Tabs defaultValue="all">
            <TabsList variant="contained">
              <Tab value="all">All</Tab>
              <Tab value="overdue" badge={12}>
                Overdue
              </Tab>
              <Tab value="paid">Paid</Tab>
              <Tab value="void" disabled>
                Void
              </Tab>
            </TabsList>
          </Tabs>
        </div>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("Tabs · contained");
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <div style={{ inlineSize: 360 }}>
          <Invoices />
        </div>
        <div style={{ inlineSize: 360 }}>
          <Tabs defaultValue="all">
            <TabsList>
              <Tab value="all" badge={1284}>
                All users
              </Tab>
              <Tab value="invited" badge={<Badge tone="warning">9</Badge>}>
                Invitations
              </Tab>
            </TabsList>
          </Tabs>
        </div>
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("Tabs");
  });
});

/** A Users page's sub-pages, as a TabNav of links. */
function UsersViews({ current = "/users/invitations" }: { current?: string }) {
  return (
    <TabNav aria-label="Users views">
      {[
        ["/users", "All users"],
        ["/users/invitations", "Invitations"],
        ["/users/deleted", "Deleted"],
      ].map(([href, label]) => (
        <TabNavLink
          key={href}
          href={`#${href}`}
          current={href === current}
          badge={href === "/users/invitations" ? 3 : undefined}
        >
          {label}
        </TabNavLink>
      ))}
    </TabNav>
  );
}

describe("TabNav", () => {
  it("is a navigation of links, not a tablist: the current page marked aria-current", async () => {
    await render(<UsersViews />);
    const nav = page.getByRole("navigation", { name: "Users views" });
    await expect.element(nav).toBeVisible();
    expect(page.getByRole("tablist").elements()).toHaveLength(0);
    expect(page.getByRole("tab").elements()).toHaveLength(0);
    const current = page.getByRole("link", { name: /Invitations/ });
    await expect.element(current).toHaveAttribute("aria-current", "page");
    await expect.element(current).toHaveAttribute("href", "#/users/invitations");
    await expect
      .element(page.getByRole("link", { name: "Deleted" }))
      .not.toHaveAttribute("aria-current");
  });

  it("draws the current page as a selected tab: weight 600 and the 3px Ember bar", async () => {
    await render(<UsersViews />);
    const current = getComputedStyle(page.getByRole("link", { name: /Invitations/ }).element());
    expect(current.fontWeight).toBe("600");
    expect(current.boxShadow).toContain(tokenColor("--qx-color-border-brand"));
    expect(current.boxShadow).toContain("-3px");
    expect(current.textDecorationLine).toBe("none");
    expect(getComputedStyle(page.getByRole("link", { name: "Deleted" }).element()).boxShadow).toBe(
      "none",
    );
  });

  it("marks a router link that sets aria-current itself", async () => {
    await render(
      <TabNav aria-label="Settings">
        <TabNavLink render={<a href="/general" aria-current="page" data-router="" />}>
          General
        </TabNavLink>
      </TabNav>,
    );
    const link = page.getByRole("link", { name: "General" });
    await expect.element(link).toHaveAttribute("data-router", "");
    expect(getComputedStyle(link.element()).fontWeight).toBe("600");
  });

  it("is accessible and looks right in every mode", async () => {
    const { container } = await render(
      <Stage>
        <UsersViews />
      </Stage>,
    );
    await expectAccessible(container);
    await screenshotEveryMode("TabNav");
  });
});
