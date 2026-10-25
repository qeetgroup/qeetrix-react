import { DownloadIcon } from "@qeetrix/icons/icons/download";
import { PlusIcon } from "@qeetrix/icons/icons/plus";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Badge } from "../../badge/badge";
import { Button } from "../../button/button";
import { hi } from "../../locales/hi";
import { QeetrixProvider } from "../../provider/provider";
import { Tab, Tabs, TabsList } from "../../tabs/tabs";
import { Breadcrumb, BreadcrumbItem } from "../breadcrumb/breadcrumb";
import { Stat, StatGroup } from "../stat/stat";
import { PageContent, PageHeader } from "./page-header";
import { PageHeaderBack } from "./page-header-back";

const html = document.documentElement;
afterEach(() => {
  delete html.dataset.qxDensity;
  html.removeAttribute("dir");
});
const rect = (element: Element | null) => (element as HTMLElement).getBoundingClientRect();

function Header({ tabs = true }: { tabs?: boolean }) {
  return (
    <Tabs defaultValue="all">
      <PageHeader
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbItem href="#directory">Directory</BreadcrumbItem>
            <BreadcrumbItem current>Users</BreadcrumbItem>
          </Breadcrumb>
        }
        title="Users"
        count={1284}
        status={<Badge tone="success">Directory synced</Badge>}
        description="People who can sign in to Acme Pvt Ltd's applications."
        actions={
          <>
            <Button variant="soft" icon={DownloadIcon}>
              Export
            </Button>
            <Button icon={PlusIcon}>Invite users</Button>
          </>
        }
        summary={
          <StatGroup>
            <Stat label="Total users" value={1284} note="+38 this week" tone="positive" />
            <Stat label="Pending invitations" value={64} note="9 expire this week" tone="warning" />
          </StatGroup>
        }
        tabs={
          tabs ? (
            <TabsList>
              <Tab value="all">All users</Tab>
              <Tab value="invitations">Invitations</Tab>
            </TabsList>
          ) : undefined
        }
      />
      <PageContent>content</PageContent>
    </Tabs>
  );
}

describe("PageHeader", () => {
  it("has the page's one h1, with its count formatted", async () => {
    const { container } = await render(<Header />);
    await expect.element(page.getByRole("heading", { level: 1, name: "Users" })).toBeVisible();
    expect(container.querySelector("[data-slot=page-header-count]")?.textContent).toBe("1,284");
  });

  it("runs its summary edge to edge, with the first number on the page gutter", async () => {
    await page.viewport(1000, 400);
    const { container } = await render(<Header />);
    const header = container.querySelector("[data-slot=page-header]") as HTMLElement;
    const summary = container.querySelector("[data-slot=page-header-summary]") as HTMLElement;
    expect(summary.getBoundingClientRect().left).toBe(header.getBoundingClientRect().left);
    expect(summary.getBoundingClientRect().width).toBe(header.getBoundingClientRect().width);
    const first = summary.querySelector("[data-slot=stat]") as HTMLElement;
    expect(getComputedStyle(first).paddingInlineStart).toBe(
      getComputedStyle(header).paddingInlineStart,
    );
  });

  it("puts the first tab label on the gutter and runs the tabs' rule edge to edge, at every density", async () => {
    for (const [width, gutter] of [
      [1000, 32],
      [600, 16],
    ] as const) {
      await page.viewport(width, 400);
      const screen = await render(<Header />);
      const header = rect(document.querySelector("[data-slot=page-header]"));
      const list = document.querySelector("[data-slot=tabs-list]") as HTMLElement;
      for (const density of ["compact", "default", "comfortable"]) {
        html.dataset.qxDensity = density;
        const where = `${width}px, ${density}`;
        const label = rect(list.querySelector("[data-slot=tab-label]"));
        expect(Math.abs(label.left - (header.left + gutter)), where).toBeLessThanOrEqual(0.5);
        // The rule is the list's own edge, so the list spans the band like the summary.
        expect(Math.abs(rect(list).left - header.left), where).toBeLessThanOrEqual(0.5);
        expect(Math.abs(rect(list).right - header.right), where).toBeLessThanOrEqual(0.5);
        const summary = rect(document.querySelector("[data-slot=page-header-summary]"));
        expect(rect(list).width, where).toBe(summary.width);
        // The Ember bar still sits under the first tab, once it has followed the new padding.
        const tab = rect(list.querySelector("[data-slot=tab]"));
        await expect
          .poll(() =>
            Math.abs(rect(list.querySelector("[data-slot=tabs-indicator]")).left - tab.left),
          )
          .toBeLessThanOrEqual(0.5);
      }
      delete html.dataset.qxDensity;
      await screen.unmount();
    }
  });

  it("links back to the parent page above the title, named for screen readers", async () => {
    await page.viewport(1000, 400);
    const { rerender } = await render(
      <PageHeader
        back={<PageHeaderBack href="#users">Users</PageHeaderBack>}
        title="Priya Sharma"
      />,
    );
    const back = page.getByRole("link", { name: "Back to Users" });
    await expect.element(back).toHaveAttribute("href", "#users");
    await expect.element(back).toHaveTextContent("Users");
    const title = page.getByRole("heading", { level: 1, name: "Priya Sharma" });
    expect(rect(back.element()).bottom).toBeLessThanOrEqual(rect(title.element()).top);
    // Its arrow sits on the title's start edge, the gutter.
    const arrow = rect(back.element().querySelector("svg"));
    expect(Math.abs(arrow.left - rect(title.element()).left)).toBeLessThanOrEqual(0.5);
    // Without a name it says "Back"; a router link comes through `render`.
    await rerender(
      <PageHeader
        back={<PageHeaderBack render={<a href="/users" data-router="" />} />}
        title="Priya Sharma"
      />,
    );
    const plain = page.getByRole("link", { name: "Back" });
    await expect.element(plain).toHaveAttribute("data-router", "");
    await expect.element(plain).toHaveAttribute("href", "/users");
    await expect.element(plain).toHaveAttribute("data-slot", "page-header-back");
  });

  it("speaks Hindi, and points its arrow the reading way, right to left", async () => {
    html.dir = "rtl";
    await render(
      <QeetrixProvider locale="hi-IN" direction="rtl" messages={hi}>
        <PageHeader
          back={<PageHeaderBack href="#users">उपयोगकर्ता</PageHeaderBack>}
          title="प्रिया शर्मा"
        />
      </QeetrixProvider>,
    );
    const back = page.getByRole("link", { name: "उपयोगकर्ता पर वापस जाएँ" });
    await expect.element(back).toBeVisible();
    expect(getComputedStyle(back.element().querySelector("svg") as SVGElement).scale).toBe("-1 1");
  });

  it("formats its count in QeetrixProvider's locale", async () => {
    const { container } = await render(
      <QeetrixProvider locale="en-US">
        <PageHeader title="Payments" count={128400} />
      </QeetrixProvider>,
    );
    expect(container.querySelector("[data-slot=page-header-count]")?.textContent).toBe("128,400");
  });

  it("ends on its summary's rule when there are no tabs", async () => {
    const { container } = await render(<Header tabs={false} />);
    const header = container.querySelector("[data-slot=page-header]") as HTMLElement;
    expect(header.dataset.foot).toBe("summary");
    expect(getComputedStyle(header).borderBottomWidth).toBe("0px");
  });

  it("is accessible and looks right in both schemes", async () => {
    await page.viewport(1000, 360);
    const { container } = await render(<Header />);
    await expectAccessible(container);
    await screenshotSchemes("PageHeader", "[data-slot=page-header]");
  });

  it("with a back link, is accessible and looks right in both schemes", async () => {
    await page.viewport(1000, 240);
    const { container } = await render(
      <PageHeader
        back={<PageHeaderBack href="#users">Users</PageHeaderBack>}
        title="Priya Sharma"
        status={<Badge tone="success">Active</Badge>}
        description="priya@acme.in · Engineering"
        actions={<Button variant="soft">Reset password</Button>}
      />,
    );
    await expectAccessible(container);
    await screenshotSchemes("PageHeader · back link", "[data-slot=page-header]");
  });
});
