/**
 * A Qeet ID console built from Qeetrix primitives and the C1 frame (07-components.md, C1 · Ruled):
 * the black scope bar, the ruled navigation, end-edge panels, and a dense Users page with its key
 * numbers. Shared by the frame tests and the C1 exit screenshots.
 */
import { QeetLogo } from "@qeetrix/icons";
import { ActivityIcon } from "@qeetrix/icons/icons/activity";
import { AppWindowIcon } from "@qeetrix/icons/icons/app-window";
import { BuildingIcon } from "@qeetrix/icons/icons/building";
import { CircleQuestionMarkIcon } from "@qeetrix/icons/icons/circle-question-mark";
import { CodeXmlIcon } from "@qeetrix/icons/icons/code-xml";
import { Columns3Icon } from "@qeetrix/icons/icons/columns-3";
import { DownloadIcon } from "@qeetrix/icons/icons/download";
import { FingerprintPatternIcon } from "@qeetrix/icons/icons/fingerprint-pattern";
import { HouseIcon } from "@qeetrix/icons/icons/house";
import { KeyRoundIcon } from "@qeetrix/icons/icons/key-round";
import { LayoutGridIcon } from "@qeetrix/icons/icons/layout-grid";
import { LifeBuoyIcon } from "@qeetrix/icons/icons/life-buoy";
import { ListFilterIcon } from "@qeetrix/icons/icons/list-filter";
import { MonitorSmartphoneIcon } from "@qeetrix/icons/icons/monitor-smartphone";
import { PlugIcon } from "@qeetrix/icons/icons/plug";
import { PlusIcon } from "@qeetrix/icons/icons/plus";
import { ScrollTextIcon } from "@qeetrix/icons/icons/scroll-text";
import { SettingsIcon } from "@qeetrix/icons/icons/settings";
import { ShieldCheckIcon } from "@qeetrix/icons/icons/shield-check";
import { ShieldUserIcon } from "@qeetrix/icons/icons/shield-user";
import { SparklesIcon } from "@qeetrix/icons/icons/sparkles";
import { UserGroupIcon } from "@qeetrix/icons/icons/user-group";
import { UsersIcon } from "@qeetrix/icons/icons/users";
import { WebhookIcon } from "@qeetrix/icons/icons/webhook";
import type { ReactElement, ReactNode } from "react";
import {
  AppShell,
  type AppShellDensity,
  AvatarItem,
  Breadcrumb,
  BreadcrumbItem,
  DataState,
  EmptyState,
  PageContent,
  PageHeader,
  Pagination,
  SearchField,
  Sidebar,
  SidebarGroup,
  SidebarItem,
  Stat,
  StatGroup,
  TopBar,
  TopBarSearch,
  TopBarSwitcher,
} from "../../src/experimental";
import {
  Avatar,
  Badge,
  Button,
  Card,
  formatRelativeTime,
  IconButton,
  Inline,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Select,
  Stack,
  Tab,
  Table,
  Tabs,
  TabsList,
  Text,
} from "../../src/index";

/** A fixed "now", so relative times read the same in every run. */
const NOW = Date.UTC(2026, 9, 25, 9, 30);
const minutes = (n: number) => NOW - n * 60_000;

const USERS = [
  ["Priya Sharma", "priya@acme.in", "Active", "Passkey", "Engineering", minutes(2)],
  ["Rahul Verma", "rahul.verma@acme.in", "Active", "Passkey", "Finance", minutes(18)],
  ["Ananya Iyer", "ananya@acme.in", "Active", "Authenticator", "Engineering", minutes(64)],
  ["Karthik Reddy", "karthik.r@acme.in", "Invited", "—", "Sales", minutes(180)],
  ["Meera Nair", "meera.nair@acme.in", "Active", "Passkey", "People", minutes(26 * 60)],
  ["Arjun Mehta", "arjun@acme.in", "Blocked", "Authenticator", "Support", minutes(3 * 24 * 60)],
  ["Sneha Kulkarni", "sneha.k@acme.in", "Active", "Passkey", "Design", minutes(5 * 24 * 60)],
  ["Vikram Singh", "vikram.singh@acme.in", "Active", "SMS", "Operations", minutes(8 * 24 * 60)],
  ["Fatima Shaikh", "fatima@acme.in", "Invited", "—", "Legal", minutes(9 * 24 * 60)],
  ["Rohan Das", "rohan.das@acme.in", "Active", "Passkey", "Engineering", minutes(12 * 24 * 60)],
  ["Divya Pillai", "divya@acme.in", "Active", "Authenticator", "Finance", minutes(20 * 24 * 60)],
  ["Aditya Joshi", "aditya.j@acme.in", "Active", "Passkey", "Sales", minutes(31 * 24 * 60)],
] as const;

const TONE = { Active: "success", Invited: "info", Blocked: "danger" } as const;

/** The users list: one Table, its states under the header (07-components.md, "One Table"). */
function UsersTable({ state }: { state: "ready" | "empty" | "loading" | "error" }) {
  return (
    <Card
      footer={
        state === "ready" ? (
          <Pagination offset={0} pageSize={12} total={1284} onOffsetChange={() => {}} />
        ) : undefined
      }
    >
      <Table
        label="Users"
        rows={state === "ready" ? USERS : []}
        loading={state === "loading"}
        error={state === "error" ? <DataState error="failed" onRetry={() => {}} /> : undefined}
        empty={
          <EmptyState
            size="section"
            icon={UsersIcon}
            title="No users yet"
            description="Invite your team, or connect a directory to sync them."
            actions={<Button icon={PlusIcon}>Invite users</Button>}
          />
        }
        rowId={([, email]) => email}
        rowLabel={([name]) => name}
        selectable
        toolbar={<Filters />}
        defaultSort={{ column: "lastSignIn", direction: "descending" }}
        bulkActions={() => (
          <>
            <Button size="sm" variant="soft" tone="neutral">
              Reset MFA
            </Button>
            <Button size="sm" variant="soft" tone="danger">
              Suspend
            </Button>
          </>
        )}
        rowActions={() => (
          <>
            <MenuItem>View profile</MenuItem>
            <MenuItem>Reset MFA</MenuItem>
            <MenuItem tone="danger">Suspend</MenuItem>
          </>
        )}
        columns={[
          {
            id: "name",
            header: "Name",
            sortable: true,
            cell: ([name, email]) => <AvatarItem name={name} description={email} />,
          },
          {
            id: "status",
            header: "Status",
            cell: ([, , status]) => <Badge tone={TONE[status]}>{status}</Badge>,
          },
          { id: "mfa", header: "MFA", cell: ([, , , mfa]) => mfa },
          { id: "department", header: "Department", cell: ([, , , , department]) => department },
          {
            id: "lastSignIn",
            header: "Last sign-in",
            align: "end",
            sortable: true,
            sortFirst: "descending",
            cell: ([, , , , , last]) => formatRelativeTime(last, "en-IN", NOW),
          },
        ]}
      />
    </Card>
  );
}

function Filters() {
  return (
    <Inline gap="sm" justify="between" style={{ flex: 1 }}>
      <Inline gap="sm">
        <SearchField
          aria-label="Search users"
          placeholder="Search by name, email or ID"
          style={{ inlineSize: 300 }}
        />
        <Select
          aria-label="Status"
          items={[
            { value: "any", label: "Status: Any" },
            { value: "active", label: "Active" },
            { value: "invited", label: "Invited" },
          ]}
          defaultValue="any"
          style={{ inlineSize: 140 }}
        />
        <Select
          aria-label="MFA"
          items={[
            { value: "any", label: "MFA: Any" },
            { value: "passkey", label: "Passkey" },
          ]}
          defaultValue="any"
          style={{ inlineSize: 140 }}
        />
        <Button variant="ghost" tone="neutral" size="lg" icon={ListFilterIcon}>
          More filters
        </Button>
      </Inline>
      <Inline gap="xs">
        <IconButton icon={Columns3Icon} aria-label="Columns" tone="neutral" size="lg" />
        <IconButton icon={DownloadIcon} aria-label="Download CSV" tone="neutral" size="lg" />
      </Inline>
    </Inline>
  );
}

function Scope({ env }: { env: Environment }) {
  return (
    <>
      <Menu>
        <MenuTrigger render={<TopBarSwitcher mark="AC" label="Acme Pvt Ltd" />} />
        <MenuContent>
          <MenuItem>Acme Pvt Ltd</MenuItem>
          <MenuItem>Acme Labs</MenuItem>
        </MenuContent>
      </Menu>
      <Menu>
        <MenuTrigger
          render={
            <TopBarSwitcher
              status={env === "production" ? "success" : "warning"}
              label={env === "production" ? "Production" : "Development"}
            />
          }
        />
        <MenuContent>
          <MenuItem>Production</MenuItem>
          <MenuItem>Development</MenuItem>
        </MenuContent>
      </Menu>
    </>
  );
}

type Environment = "production" | "development";

export interface FrameProps {
  /** The sidebar item marked current. */
  current?: string;
  env?: Environment;
  banners?: ReactNode;
  notifications?: ReactNode;
  collapsed?: boolean;
  drawer?: string | null;
  density?: AppShellDensity;
  children?: ReactNode;
}

/** The Qeet ID console frame: the scope bar, the navigation and the panels, around any page. */
export function QeetIdFrame({
  current = "users",
  env = "production",
  banners,
  notifications,
  collapsed = false,
  drawer = null,
  density = "compact",
  children,
}: FrameProps): ReactElement {
  const is = (id: string) => current === id;
  return (
    <AppShell
      density={density}
      defaultSidebarCollapsed={collapsed}
      defaultActiveDrawer={drawer}
      banners={banners}
      notifications={notifications}
      topBar={
        <TopBar
          launcher={<IconButton icon={LayoutGridIcon} aria-label="Qeet products" tone="neutral" />}
          logo={<QeetLogo variant="dark" height={20} />}
          product="Qeet ID"
          href="#home"
          context={<Scope env={env} />}
          search={<TopBarSearch placeholder="Search or jump to…" shortcut={["⌘", "K"]} />}
          actions={<IconButton icon={SettingsIcon} aria-label="Settings" tone="neutral" />}
          account={<Avatar name="Priya Sharma" size="sm" />}
        />
      }
      sidebar={
        <Sidebar
          label="Qeet ID"
          footer={
            <SidebarGroup>
              <SidebarItem label="Settings" href="#settings" icon={SettingsIcon} />
              <SidebarItem label="Help and docs" href="#help" icon={LifeBuoyIcon} />
            </SidebarGroup>
          }
        >
          <SidebarGroup>
            <SidebarItem
              label="Overview"
              href="#overview"
              icon={HouseIcon}
              current={is("overview")}
            />
          </SidebarGroup>
          <SidebarGroup label="Directory">
            <SidebarItem
              label="Users"
              href="#users"
              icon={UsersIcon}
              current={is("users")}
              filledWhenCurrent
              badge="1,284"
            />
            <SidebarItem label="Groups" href="#groups" icon={UserGroupIcon} badge="38" />
            <SidebarItem label="Organisations" href="#orgs" icon={BuildingIcon} />
          </SidebarGroup>
          <SidebarGroup label="Access">
            <SidebarItem
              label="Applications"
              href="#apps"
              icon={AppWindowIcon}
              badge="12"
              current={is("apps")}
            />
            <SidebarItem label="Connections" icon={PlugIcon}>
              <SidebarItem label="Passkeys" href="#passkeys" />
              <SidebarItem label="Enterprise SSO" href="#sso" />
              <SidebarItem label="Social" href="#social" />
            </SidebarItem>
            <SidebarItem label="Roles" href="#roles" icon={ShieldUserIcon} />
          </SidebarGroup>
          <SidebarGroup label="Security">
            <SidebarItem label="Authentication" href="#authn" icon={FingerprintPatternIcon} />
            <SidebarItem label="Sessions" href="#sessions" icon={MonitorSmartphoneIcon} />
            <SidebarItem label="Policies" href="#policies" icon={ShieldCheckIcon} />
            <SidebarItem label="Audit logs" href="#audit" icon={ScrollTextIcon} />
          </SidebarGroup>
          <SidebarGroup label="Developers">
            <SidebarItem label="API keys" href="#keys" icon={KeyRoundIcon} current={is("keys")} />
            <SidebarItem label="Webhooks" href="#webhooks" icon={WebhookIcon} />
            <SidebarItem label="SDKs" href="#sdks" icon={CodeXmlIcon} />
          </SidebarGroup>
        </Sidebar>
      }
      drawers={[
        {
          id: "assistant",
          label: "Qeet AI",
          icon: SparklesIcon,
          badge: true,
          content: <Text>Ask about your users.</Text>,
        },
        {
          id: "help",
          label: "Help",
          icon: CircleQuestionMarkIcon,
          content: (
            <Stack gap="sm">
              <Text weight="semibold">Users</Text>
              <Text size="sm" tone="subtle">
                People who can sign in to your organisation's applications. Invite them, or connect
                a directory to sync them.
              </Text>
            </Stack>
          ),
        },
        {
          id: "activity",
          label: "Activity",
          icon: ActivityIcon,
          content: <Text>Recent changes.</Text>,
        },
      ]}
    >
      {children}
    </AppShell>
  );
}

export interface ConsoleProps {
  collapsed?: boolean;
  state?: "ready" | "empty" | "loading" | "error";
  drawer?: string | null;
  density?: AppShellDensity;
}

/** The Qeet ID console: Directory › Users. */
export function QeetIdConsole({
  collapsed = false,
  state = "ready",
  drawer = null,
  density = "compact",
}: ConsoleProps): ReactElement {
  const ready = state === "ready";
  return (
    <QeetIdFrame collapsed={collapsed} drawer={drawer} density={density}>
      <Tabs defaultValue="all">
        <PageHeader
          breadcrumb={
            <Breadcrumb>
              <BreadcrumbItem href="#directory">Directory</BreadcrumbItem>
              <BreadcrumbItem current>Users</BreadcrumbItem>
            </Breadcrumb>
          }
          title="Users"
          description="People who can sign in to Acme Pvt Ltd's applications. Synced from Azure AD 4 minutes ago."
          actions={
            <>
              <Button variant="soft" icon={DownloadIcon}>
                Export
              </Button>
              <Button icon={PlusIcon}>Invite users</Button>
            </>
          }
          summary={
            ready ? (
              <StatGroup>
                <Stat
                  label="Total users"
                  value={1284}
                  note="+38 this week"
                  tone="positive"
                  trend={[1080, 1094, 1110, 1121, 1139, 1150, 1172, 1190, 1205, 1231, 1246, 1284]}
                />
                <Stat
                  label="Active, last 30 days"
                  value={1102}
                  note="85.8% of users"
                  trend={[980, 1010, 995, 1040, 1032, 1061, 1050, 1072, 1068, 1090, 1085, 1102]}
                />
                <Stat
                  label="Passkey adoption"
                  value="72%"
                  note="+6 pts this month"
                  tone="positive"
                  trend={[41, 44, 47, 50, 53, 55, 58, 61, 63, 66, 69, 72]}
                />
                <Stat
                  label="Pending invitations"
                  value={64}
                  note="9 expire this week"
                  tone="warning"
                  trend={[30, 34, 31, 40, 38, 45, 52, 49, 55, 58, 61, 64]}
                />
              </StatGroup>
            ) : undefined
          }
          tabs={
            <TabsList>
              <Tab value="all">All users</Tab>
              <Tab value="invitations">Invitations</Tab>
              <Tab value="blocked">Blocked</Tab>
            </TabsList>
          }
        />
        <PageContent>
          <UsersTable state={state} />
        </PageContent>
      </Tabs>
    </QeetIdFrame>
  );
}
