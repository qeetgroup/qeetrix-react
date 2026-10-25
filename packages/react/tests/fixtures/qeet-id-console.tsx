/**
 * A Qeet ID console built from Qeetrix primitives and the C1 frame (07-components.md): the global
 * bar, the navigation, end-edge panels, and a dense Users page. Shared by the frame tests and the
 * C1 exit screenshots.
 */
import { QeetLogo } from "@qeetrix/icons";
import { ActivityIcon } from "@qeetrix/icons/icons/activity";
import { ChevronDownIcon } from "@qeetrix/icons/icons/chevron-down";
import { ChevronLeftIcon } from "@qeetrix/icons/icons/chevron-left";
import { ChevronRightIcon } from "@qeetrix/icons/icons/chevron-right";
import { CircleQuestionMarkIcon } from "@qeetrix/icons/icons/circle-question-mark";
import { DownloadIcon } from "@qeetrix/icons/icons/download";
import { EllipsisIcon } from "@qeetrix/icons/icons/ellipsis";
import { HouseIcon } from "@qeetrix/icons/icons/house";
import { KeyRoundIcon } from "@qeetrix/icons/icons/key-round";
import { LayoutGridIcon } from "@qeetrix/icons/icons/layout-grid";
import { PlusIcon } from "@qeetrix/icons/icons/plus";
import { SearchIcon } from "@qeetrix/icons/icons/search";
import { SettingsIcon } from "@qeetrix/icons/icons/settings";
import { ShieldIcon } from "@qeetrix/icons/icons/shield";
import { SparklesIcon } from "@qeetrix/icons/icons/sparkles";
import { UsersIcon } from "@qeetrix/icons/icons/users";
import { WebhookIcon } from "@qeetrix/icons/icons/webhook";
import type { ReactElement } from "react";
import {
  AppShell,
  type AppShellDensity,
  Breadcrumb,
  BreadcrumbItem,
  DataState,
  EmptyState,
  PageContent,
  PageHeader,
  Sidebar,
  SidebarGroup,
  SidebarItem,
  TopBar,
} from "../../src/experimental";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  formatRelativeTime,
  IconButton,
  Inline,
  Input,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  Text,
  VisuallyHidden,
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

function UsersTable() {
  return (
    <Card>
      <Table aria-label="Users">
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox aria-label="Select all users" indeterminate />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>MFA</TableHead>
            <TableHead>Department</TableHead>
            <TableHead align="end">Last active</TableHead>
            <TableHead>
              <VisuallyHidden>Actions</VisuallyHidden>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {USERS.map(([name, email, status, mfa, department, last], index) => (
            <TableRow key={email} selected={index === 1}>
              <TableCell>
                <Checkbox aria-label={`Select ${name}`} defaultChecked={index === 1} />
              </TableCell>
              <TableCell>
                <Inline gap="sm" wrap={false}>
                  <Avatar name={name} size="sm" decorative />
                  <Stack gap="none">
                    <Text weight="medium">{name}</Text>
                    <Text size="sm" tone="subtle">
                      {email}
                    </Text>
                  </Stack>
                </Inline>
              </TableCell>
              <TableCell>
                <Badge tone={TONE[status]}>{status}</Badge>
              </TableCell>
              <TableCell>{mfa}</TableCell>
              <TableCell>{department}</TableCell>
              <TableCell align="end">{formatRelativeTime(last, "en-IN", NOW)}</TableCell>
              <TableCell align="end">
                <IconButton
                  icon={EllipsisIcon}
                  aria-label={`Actions for ${name}`}
                  tone="neutral"
                  size="sm"
                  tooltip={false}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function Filters() {
  return (
    <Inline gap="sm" justify="between">
      <Inline gap="sm">
        <Input
          aria-label="Search users"
          placeholder="Search by name or email"
          icon={SearchIcon}
          style={{ inlineSize: 280 }}
        />
        <Select
          aria-label="Status"
          items={[
            { value: "any", label: "Status: any" },
            { value: "active", label: "Active" },
            { value: "invited", label: "Invited" },
          ]}
          defaultValue="any"
          style={{ inlineSize: 150 }}
        />
        <Select
          aria-label="MFA"
          items={[
            { value: "any", label: "MFA: any" },
            { value: "passkey", label: "Passkey" },
          ]}
          defaultValue="any"
          style={{ inlineSize: 140 }}
        />
      </Inline>
      <Inline gap="xs">
        <Text size="sm" tone="subtle">
          1–12 of 1,284
        </Text>
        <IconButton
          icon={ChevronLeftIcon}
          aria-label="Previous page"
          tone="neutral"
          size="sm"
          disabled
          tooltip={false}
        />
        <IconButton
          icon={ChevronRightIcon}
          aria-label="Next page"
          tone="neutral"
          size="sm"
          tooltip={false}
        />
      </Inline>
    </Inline>
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
  return (
    <AppShell
      density={density}
      defaultSidebarCollapsed={collapsed}
      defaultActiveDrawer={drawer}
      topBar={
        <TopBar
          launcher={<IconButton icon={LayoutGridIcon} aria-label="Qeet products" tone="neutral" />}
          logo={<QeetLogo variant="dark" height={20} />}
          product="Qeet ID"
          href="#home"
          context={
            <>
              <Button variant="ghost" tone="neutral" size="sm" icon={ChevronDownIcon}>
                Acme Pvt Ltd
              </Button>
              <Badge tone="warning">Production</Badge>
            </>
          }
          search={
            <Input
              aria-label="Search Qeet ID"
              placeholder="Search users, applications and settings"
              icon={SearchIcon}
              endAdornment="/"
            />
          }
          actions={<IconButton icon={SettingsIcon} aria-label="Settings" tone="neutral" />}
          account={<Avatar name="Priya Sharma" size="sm" />}
        />
      }
      sidebar={
        <Sidebar label="Qeet ID" title="Identity" filter>
          <SidebarGroup>
            <SidebarItem label="Overview" href="#overview" icon={HouseIcon} />
          </SidebarGroup>
          <SidebarGroup label="Directory">
            <SidebarItem
              label="Users"
              href="#users"
              icon={UsersIcon}
              current
              filledWhenCurrent
              badge="1,284"
            />
            <SidebarItem label="Organisations" href="#orgs" icon={LayoutGridIcon} />
          </SidebarGroup>
          <SidebarGroup label="Access">
            <SidebarItem label="Applications" href="#apps" icon={KeyRoundIcon} />
            <SidebarItem label="Connections" icon={ShieldIcon}>
              <SidebarItem label="Passkeys" href="#passkeys" />
              <SidebarItem label="Enterprise SSO" href="#sso" />
              <SidebarItem label="Social" href="#social" />
            </SidebarItem>
          </SidebarGroup>
          <SidebarGroup label="Security">
            <SidebarItem label="Sessions" href="#sessions" icon={ShieldIcon} />
            <SidebarItem label="Audit logs" href="#audit" icon={ActivityIcon} />
          </SidebarGroup>
          <SidebarGroup label="Developers">
            <SidebarItem label="Webhooks" href="#webhooks" icon={WebhookIcon} />
          </SidebarGroup>
        </Sidebar>
      }
      drawers={[
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
          id: "assistant",
          label: "Qeet AI",
          icon: SparklesIcon,
          badge: true,
          content: <Text>Ask about your users.</Text>,
        },
        {
          id: "activity",
          label: "Activity",
          icon: ActivityIcon,
          content: <Text>Recent changes.</Text>,
        },
      ]}
    >
      <Tabs defaultValue="all">
        <PageHeader
          breadcrumb={
            <Breadcrumb>
              <BreadcrumbItem href="#directory">Directory</BreadcrumbItem>
              <BreadcrumbItem current>Users</BreadcrumbItem>
            </Breadcrumb>
          }
          title="Users"
          count={state === "ready" ? 1284 : undefined}
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
              <Tab value="blocked">Blocked</Tab>
            </TabsList>
          }
        />
        <PageContent>
          <Filters />
          <DataState
            loading={state === "loading"}
            error={state === "error" ? "failed" : undefined}
            onRetry={() => {}}
            empty={state === "empty"}
            emptyState={
              <EmptyState
                icon={UsersIcon}
                title="No users yet"
                description="Invite your team, or connect a directory to sync them."
                actions={<Button icon={PlusIcon}>Invite users</Button>}
              />
            }
          >
            <UsersTable />
          </DataState>
        </PageContent>
      </Tabs>
    </AppShell>
  );
}
