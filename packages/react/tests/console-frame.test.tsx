/**
 * The exit for increment C1 (07-components.md): two products' console frames from the same parts,
 * since a pattern needs two products. Qeet ID's Users page shows the empty, loading and error
 * states; Qeet Pay's frame proves the parts carry another product's navigation.
 */
import { BellIcon } from "@qeetrix/icons/icons/bell";
import { CreditCardIcon } from "@qeetrix/icons/icons/credit-card";
import { FileTextIcon } from "@qeetrix/icons/icons/file-text";
import { HouseIcon } from "@qeetrix/icons/icons/house";
import { KeyRoundIcon } from "@qeetrix/icons/icons/key-round";
import { LayoutGridIcon } from "@qeetrix/icons/icons/layout-grid";
import { SettingsIcon } from "@qeetrix/icons/icons/settings";
import { ShieldIcon } from "@qeetrix/icons/icons/shield";
import { UsersIcon } from "@qeetrix/icons/icons/users";
import { WalletIcon } from "@qeetrix/icons/icons/wallet";
import { WebhookIcon } from "@qeetrix/icons/icons/webhook";
import { afterEach, describe, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  AppShell,
  Breadcrumb,
  BreadcrumbItem,
  DataState,
  EmptyState,
  Sidebar,
  SidebarGroup,
  SidebarItem,
  useAppShell,
} from "../src/experimental";
import {
  Avatar,
  Badge,
  Button,
  Heading,
  IconButton,
  QeetrixProvider,
  Stack,
  Text,
} from "../src/index";
import { expectAccessible } from "./support/axe";
import { canEmulateMedia, emulateMedia } from "./support/media";
import { screenshotEveryMode, screenshotSchemes } from "./support/screenshots";

/** The organisation switcher: the name, or just its avatar in the rail (useAppShell). */
function Organisation() {
  const { collapsed } = useAppShell();
  return collapsed ? (
    <Avatar name="Acme Pvt Ltd" size="sm" />
  ) : (
    <Text weight="semibold" truncate>
      Acme Pvt Ltd
    </Text>
  );
}

function QeetIdConsole({
  collapsed = false,
  state = "empty",
}: {
  collapsed?: boolean;
  state?: "empty" | "loading" | "error";
}) {
  return (
    <AppShell
      defaultSidebarCollapsed={collapsed}
      sidebar={
        <Sidebar label="Qeet ID" header={<Organisation />}>
          <SidebarGroup>
            <SidebarItem label="Overview" href="#overview" icon={HouseIcon} />
          </SidebarGroup>
          <SidebarGroup label="Directory">
            <SidebarItem label="Users" href="#users" icon={UsersIcon} current filledWhenCurrent />
            <SidebarItem label="Organisations" href="#orgs" icon={LayoutGridIcon} />
            <SidebarItem label="Sessions" href="#sessions" icon={ShieldIcon} />
          </SidebarGroup>
          <SidebarGroup label="Developers">
            <SidebarItem label="Applications" href="#apps" icon={KeyRoundIcon} />
            <SidebarItem label="Webhooks" href="#webhooks" icon={WebhookIcon} />
          </SidebarGroup>
          <SidebarGroup label="Settings">
            <SidebarItem label="Settings" href="#settings" icon={SettingsIcon} />
          </SidebarGroup>
        </Sidebar>
      }
      header={
        <Breadcrumb>
          <BreadcrumbItem href="#directory">Directory</BreadcrumbItem>
          <BreadcrumbItem current>Users</BreadcrumbItem>
        </Breadcrumb>
      }
      actions={
        <>
          <Badge tone="warning">Production</Badge>
          <IconButton icon={BellIcon} aria-label="Notifications" tone="neutral" />
        </>
      }
    >
      <Stack gap="lg">
        <Heading level={1}>Users</Heading>
        <DataState
          loading={state === "loading"}
          error={state === "error" ? "failed" : undefined}
          onRetry={() => {}}
          empty
          emptyState={
            <EmptyState
              icon={UsersIcon}
              title="No users yet"
              description="Invite your team, or connect a directory to sync them."
              actions={<Button>Invite users</Button>}
            />
          }
        />
      </Stack>
    </AppShell>
  );
}

function QeetPayConsole() {
  return (
    <AppShell
      sidebar={
        <Sidebar label="Qeet Pay" header={<Text weight="semibold">Qeet Pay</Text>}>
          <SidebarGroup label="Money">
            <SidebarItem label="Payments" href="#payments" icon={CreditCardIcon} />
            <SidebarItem label="Payouts" href="#payouts" icon={WalletIcon} />
            <SidebarItem label="Invoices" icon={FileTextIcon}>
              <SidebarItem label="Sent" href="#sent" current />
              <SidebarItem label="E-invoices (IRN)" href="#irn" />
            </SidebarItem>
          </SidebarGroup>
        </Sidebar>
      }
      header={
        <Breadcrumb>
          <BreadcrumbItem href="#invoices">Invoices</BreadcrumbItem>
          <BreadcrumbItem current>Sent</BreadcrumbItem>
        </Breadcrumb>
      }
    >
      <Heading level={1}>Sent invoices</Heading>
    </AppShell>
  );
}

const html = document.documentElement;
let reset: (() => Promise<void>) | undefined;
afterEach(async () => {
  await reset?.();
  reset = undefined;
  html.removeAttribute("dir");
});

describe("C1 exit: console frames from the same parts", () => {
  it("Qeet ID: the Users page, empty, in every mode", async () => {
    await page.viewport(1280, 720);
    const { container } = await render(<QeetIdConsole />);
    await expectAccessible(container);
    await screenshotEveryMode("Console · Qeet ID · users", null);
  });

  it("Qeet ID: collapsed to the rail, and the error and loading states", async () => {
    await page.viewport(1280, 720);
    const screen = await render(<QeetIdConsole collapsed state="error" />);
    await screenshotSchemes("Console · Qeet ID · rail and error", null);
    await screen.rerender(<QeetIdConsole state="loading" />);
    await screenshotSchemes("Console · Qeet ID · loading", null);
  });

  it("Qeet ID: narrow, with the navigation drawer open", async () => {
    await page.viewport(420, 760);
    await render(<QeetIdConsole />);
    await page.getByRole("button", { name: "Open navigation" }).click();
    await screenshotSchemes("Console · Qeet ID · narrow", null);
  });

  it("Qeet ID: right-to-left and forced colours", async () => {
    await page.viewport(1280, 720);
    html.dir = "rtl";
    await render(
      <QeetrixProvider direction="rtl">
        <QeetIdConsole />
      </QeetrixProvider>,
    );
    await screenshotSchemes("Console · Qeet ID · right-to-left", null);
    if (canEmulateMedia) {
      reset = await emulateMedia({ "forced-colors": "active" });
      await screenshotSchemes("Console · Qeet ID · forced colours", null);
    }
  });

  it("Qeet Pay: another product's navigation in the same frame", async () => {
    await page.viewport(1280, 720);
    const { container } = await render(<QeetPayConsole />);
    await expectAccessible(container);
    await screenshotSchemes("Console · Qeet Pay", null);
  });
});
