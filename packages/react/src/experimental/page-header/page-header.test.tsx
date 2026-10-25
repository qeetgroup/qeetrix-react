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
import { PageContent, PageHeader } from "./page-header";

function Header() {
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
        tabs={
          <TabsList>
            <Tab value="all">All users</Tab>
            <Tab value="invitations">Invitations</Tab>
          </TabsList>
        }
      />
      <PageContent>content</PageContent>
    </Tabs>
  );
}

describe("PageHeader", () => {
  it("has the page's one h1, with its count formatted", async () => {
    await render(<Header />);
    await expect.element(page.getByRole("heading", { level: 1, name: "Users" })).toBeVisible();
    await expect.element(page.getByText("1,284")).toBeVisible();
  });

  it("is accessible and looks right in both schemes", async () => {
    await page.viewport(1000, 260);
    const { container } = await render(<Header />);
    await expectAccessible(container);
    await screenshotSchemes("PageHeader", "[data-slot=page-header]");
  });
});
