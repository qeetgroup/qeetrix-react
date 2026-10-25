import { DownloadIcon } from "@qeetrix/icons/icons/download";
import { PlusIcon } from "@qeetrix/icons/icons/plus";
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectAccessible } from "../../../tests/support/axe";
import { screenshotSchemes } from "../../../tests/support/screenshots";
import { Badge } from "../../badge/badge";
import { Button } from "../../button/button";
import { Tab, Tabs, TabsList } from "../../tabs/tabs";
import { Breadcrumb, BreadcrumbItem } from "../breadcrumb/breadcrumb";
import { Stat, StatGroup } from "../stat/stat";
import { PageContent, PageHeader } from "./page-header";

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
});
