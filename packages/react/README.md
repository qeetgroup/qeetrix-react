# @qeetrix/react

**The React components of Qeetrix, the Qeet Group design system.** Accessible, token-driven
components built on [Base UI](https://base-ui.com): the parts every Qeet product and console is made
of, in English and Hindi, light and dark, at three densities, left to right and right to left.

[![npm](https://img.shields.io/npm/v/@qeetrix/react?color=d04800)](https://www.npmjs.com/package/@qeetrix/react)
[![CI](https://github.com/qeetgroup/qeetrix-react/actions/workflows/ci.yml/badge.svg)](https://github.com/qeetgroup/qeetrix-react/actions/workflows/ci.yml)
[![React 19](https://img.shields.io/badge/React-19-149eca)](https://react.dev)
[![ESM only](https://img.shields.io/badge/module-ESM%20only-555)](#entry-points-and-server-components)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](https://github.com/qeetgroup/qeetrix-react/blob/main/LICENSE)

[Changelog](https://github.com/qeetgroup/qeetrix-react/blob/main/packages/react/CHANGELOG.md) ·
[Storybook](https://github.com/qeetgroup/qeetrix-story) ·
[`@qeetrix/tokens`](https://www.npmjs.com/package/@qeetrix/tokens) ·
[`@qeetrix/icons`](https://www.npmjs.com/package/@qeetrix/icons)

**Contents:** [Install](#install) · [Styles](#styles) · [Quick start](#quick-start) ·
[Components](#components) · [Forms](#forms) · [Tables](#tables) · [Overlays](#overlays) ·
[Theming](#theming) · [Language and direction](#language-and-direction) ·
[Formatting](#formatting) · [Experimental](#experimental-the-console-frame) ·
[Entry points](#entry-points-and-server-components) · [Accessibility](#accessibility) ·
[Versioning](#versioning)

## Install

```bash
bun add @qeetrix/react @qeetrix/tokens @base-ui/react @qeetrix/icons
```

| Package | Why |
|:--|:--|
| `@qeetrix/tokens` | The design tokens every component reads. Use a version the peer range names (any 0.0.x from 0.0.10, for 0.2.1). |
| `@base-ui/react` | Powers the interactive components |
| `@qeetrix/icons` | Icons: a component's `icon` prop takes any of them, `icon={PlusIcon}`, or as an element, `icon={<PlusIcon />}`, which a Server Component can pass (write `shape="sharp"` there) |
| `react`, `react-dom` | 19.2 or later |

## Styles

Load the tokens, then the component styles, once at the root of your app:

```css
@import "@qeetrix/tokens/tokens.css";
@import "@qeetrix/react/styles.css" layer(components);
```

- **The full path, `@qeetrix/tokens/tokens.css`,** resolves in every bundler. The bare
  `@import "@qeetrix/tokens"` needs a resolver that reads the package's `style` condition, as
  Tailwind v4 does; Vite's CSS `@import` doesn't, and the build stops.
- **With Tailwind v4,** declare its layer order first. Otherwise the `components` layer is declared
  by the Qeetrix import, ranks lowest, and Tailwind's preflight overrides Qeetrix (buttons lose their
  padding, headings their sizes) with no warning:

  ```css
  @layer theme, base, components, utilities;
  @import "@qeetrix/tokens/tokens.css";
  @import "@qeetrix/react/styles.css" layer(components);
  @import "tailwindcss";
  ```

- **Precompiled:** your Tailwind setup doesn't need to scan this package, and it ships no utility
  classes.
- **Cascade layers:** Qeetrix styles sit in the `qx.base` and `qx.components` layers, so your own
  layout utilities override them without `!important`.
- **One component's styles:** `@qeetrix/react/css/stack.css` if you'd rather not load the full
  stylesheet. A family's stylesheet brings the base styles and those of the components it renders
  (`css/text-field.css` brings Field and Input).

## Quick start

```tsx
import { PlusIcon } from "@qeetrix/icons/icons/plus";
import {
  Box, Button, Grid, Heading, Inline, QeetrixProvider, SkipLink, Stack, Text, ToastProvider,
} from "@qeetrix/react";

export function Invoices() {
  return (
    <QeetrixProvider locale="en-IN" defaultColorScheme="system">
      <ToastProvider>
        <SkipLink />
        <main id="main">
          <Stack gap="xl">
            <Inline justify="between">
              <Heading level={1}>Invoices</Heading>
              <Button icon={PlusIcon}>New invoice</Button>
            </Inline>
            <Grid columns={{ base: 1, medium: 2, large: 3 }} gap="md">
              <Box padding="lg" background="raised" border="default" radius="surface">
                <Text tone="subtle">Due this month</Text>
              </Box>
            </Grid>
          </Stack>
        </main>
      </ToastProvider>
    </QeetrixProvider>
  );
}
```

**Two rules keep every product looking the same:**
- **Looks go through props:** `variant` is the look, `size` the dimension, `tone` the meaning.
- **`className` is for placement only:** margin, width, grid placement. On a form control,
  `className` and `style` place the whole row, while `ref` and every other prop go to the control.

## Components

| Component | For |
|:--|:--|
| **Layout** | |
| `Box` | A token-only surface: padding, background, border, corners |
| `Stack`, `Inline` | Vertical and horizontal flows with token gaps (`none` … `4xl`); as `ul`/`ol` they keep list semantics |
| `Grid`, `GridItem` | Columns per window size class (600 / 840 / 1200 / 1600px); `GridItem` spans and starts columns, responsively |
| `Card` | A ruled surface with a title, actions and footer; `variant="subdued"` for secondary panels, `tone="danger"` for a danger zone; a table inside runs edge to edge |
| `Separator` | A 1px line, horizontal or vertical |
| `ScrollArea` | A scrolling region with Qeetrix scrollbars, focusable and named |
| **Type** | |
| `Heading` | `level` sets h1–h6; `size` sets the look (display, heading, title) |
| `Text` | Body text: size, weight, tone, monospace, truncation |
| `Link` | Inline navigation that wraps with its sentence; `external` opens a new tab safely and says so to screen readers |
| `SkipLink`, `VisuallyHidden` | "Skip to main content", hidden until focused; content for screen readers only |
| **Actions** | |
| `Button` | Label first, an optional trailing icon; `solid` (primary), `soft` (secondary), `ghost`; `brand`, `neutral` or `danger`; `loading` |
| `IconButton` | A square, icon-only button; its `aria-label` is required by its type and shows as a tooltip |
| `Toggle`, `ToggleGroup` | Pressed or not; segmented or separate groups, single or `multiple` |
| **Forms** | |
| `TextField` | Label, input, help text and error in one: the default form row |
| `Field`, `Fieldset` | The label, help and error around any control; a section of fields under a legend |
| `Input`, `Textarea` | The filled text box with a bottom line; Textarea grows with its content |
| `Checkbox`, `CheckboxGroup` | On/off, or several of a set; a `parent` checkbox selects all and shows a dash while mixed |
| `Radio`, `RadioGroup` | One of a set; `RadioGroup variant="tile"` (and `CheckboxGroup`'s) for choice tiles |
| `Switch` | A setting that applies at once |
| `Select` | One option, or several, from up to about 15 |
| `Slider` | A number or a range on a scale, with a formatted value |
| **Overlays** | |
| `Dialog` | A focused task or decision, `sm` to `xl` and `fullscreen`; `intent="danger"` makes a confirmation only its actions close |
| `Drawer` | A side panel for details or an edit form, swipeable on touch; `dismissible={false}` for a task that must be finished |
| `Popover` | A panel anchored to a trigger: filters, details, a short form |
| `Tooltip` | A short label for a control; `TooltipProvider` groups neighbours |
| `Menu`, `ContextMenu` | Actions from a trigger, or at the pointer on right-click and Shift+F10: icons, descriptions, shortcuts, checkbox and radio items, submenus |
| `ToastProvider`, `useToast` | Brief notifications with a status edge; `promise` toasts; errors stay until dismissed |
| **Navigation and disclosure** | |
| `Tabs` | Views of one context: the sliding Ember bar, or `variant="contained"`; a `badge` count per tab |
| `Accordion`, `Collapsible` | Ruled sections, or one section, that show and hide |
| **Display and status** | |
| `Table` | One data-driven table: columns and rows, sorting, selection with bulk actions, row actions, clickable rows and a loading line |
| `Badge` | A status pill in six tones, `subtle` or `solid`, `md` or `sm` |
| `Avatar` | A photo or initials; `shape="square"` for organisations, apps and tenants; a `status` dot read with the name |
| `Progress`, `Meter` | A task advancing, or a measurement within a range, in tones |
| `Spinner`, `Skeleton` | An indeterminate wait; a placeholder shaped like the content, with a `lines` preset |

## Forms

```tsx
import { Checkbox, CheckboxGroup, Fieldset, Radio, RadioGroup, TextField } from "@qeetrix/react";

<Fieldset legend="Company">
  <TextField label="Trade name" name="tradeName" optional />
  <TextField label="GSTIN" name="gstin" required description="15 characters." />
  <RadioGroup label="Billing cycle" name="cycle" defaultValue="monthly">
    <Radio value="monthly" label="Monthly" />
    <Radio value="yearly" label="Yearly" description="Two months free." />
  </RadioGroup>
  <CheckboxGroup label="Notify me by" name="notify" orientation="horizontal">
    <Checkbox value="email" label="Email" />
    <Checkbox value="sms" label="SMS" />
  </CheckboxGroup>
</Fieldset>
```

`Form` and `ErrorSummary` (experimental) add submit-time validation with a linked summary of every
error, the GOV.UK pattern.

## Tables

```tsx
import { Badge, Table } from "@qeetrix/react";

<Table
  label="Users"
  rows={users}
  rowId={(user) => user.id}
  rowLabel={(user) => user.name}
  columns={[
    { id: "name", header: "Name", cell: (user) => user.name, sortable: true, primary: true },
    { id: "role", header: "Role", cell: (user) => user.role },
    { id: "status", header: "Status", cell: (user) => <Badge tone="success">{user.status}</Badge> },
  ]}
  defaultSort={{ column: "name", direction: "ascending" }}
  selectable
  bulkActions={(ids) => <RemoveUsers ids={ids} />}
  rowHref={(user) => `/users/${user.id}`}
/>
```

A clickable row has one real link, on its `primary` cell, so the whole row opens the record and
keyboard and screen-reader users get a proper link. Use `renderRowLink` for your router's `Link`.

## Overlays

Overlays share one shape: a root that holds the state, a trigger that renders your control, and a
content part that assembles the rest. Wrap the app once in `ToastProvider` (and, if you like,
`TooltipProvider`).

```tsx
import {
  Button, Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger, useToast,
} from "@qeetrix/react";

function RevokeKey({ onRevoke }: { onRevoke: () => Promise<void> }) {
  const toast = useToast();
  return (
    <Dialog intent="danger">
      <DialogTrigger render={<Button tone="danger">Revoke key</Button>} />
      <DialogContent title="Revoke this API key?" description="Apps using it stop working at once.">
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Cancel</Button>} />
          <DialogClose
            render={<Button tone="danger">Revoke key</Button>}
            onClick={() =>
              toast.promise(onRevoke(), {
                loading: { title: "Revoking…" },
                success: { title: "Key revoked" },
                error: { title: "Couldn't revoke the key" },
              })
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## Theming

Every colour, size and duration is a `--qx-*` token from `@qeetrix/tokens`, so theming is a matter of
attributes, never of overriding component CSS.

| Setting | How |
|:--|:--|
| **Colour scheme** | `QeetrixProvider defaultColorScheme="system"` (or `"light"`, `"dark"`) sets `data-qx-color-scheme` on `<html>`; `useColorScheme()` reads and changes it, and `ThemeSwitcher` (experimental) is the switch for it |
| **Density** | `data-qx-density="compact"`, `"default"` or `"comfortable"` on any region: compact for consoles, comfortable for sign-in and checkout |
| **A tenant's brand** | `brandTheme("#1a73e8")` from `@qeetrix/tokens` turns one colour into the brand tokens for both schemes, with contrast guaranteed |

```tsx
const { resolvedColorScheme, setColorScheme } = useColorScheme();

<main data-qx-density="compact">{consolePage}</main>
```

**The scheme before the first paint:** `colorSchemeScript()` in the `<head>` sets the saved choice on
`<html>` before React runs, and `QeetrixProvider storageKey="qx-color-scheme"` saves new ones under
the same key. On Apple platforms it also sets `<html data-qx-platform="apple">`, so `Kbd` shows ⌘ ⌥ ⇧
from the first paint.

**A page without React** (a static site's chrome): `colorSchemeScript({ followSystem: true })` keeps
following the device while the choice is System, and `Kbd` rendered to HTML shows the right keys
from that attribute. `ThemeSwitcher` needs React to run: on such a page, draw the switch as a plain
control that saves `light`, `dark` or `system` under the same key and sets `data-qx-color-scheme`.

## Language and direction

`QeetrixProvider` sets the locale (used for formatting), the reading direction and the library's own
strings ("Close", "(optional)", "Loading"…). Locale packs are separate imports, so a language you
don't use never ships:

```tsx
import { QeetrixProvider } from "@qeetrix/react";
import { hi } from "@qeetrix/react/locales/hi";

<QeetrixProvider locale="hi-IN" messages={hi}>{app}</QeetrixProvider>
```

- **Override one string:** pass a `messages` prop to the component, e.g.
  `<Field messages={{ optional: "(if any)" }}>`.
- **Server-safe components** (Link, Spinner, SkipLink) can't read the provider; pass their strings
  per instance.
- **Right to left:** set `direction="rtl"` on the provider and `dir="rtl"` on `<html>`. Components
  use logical properties, so they mirror by themselves, and their own arrows and chevrons point the
  right way.
- **Icons that point a reading direction** (log-in, log-out, send, reply, undo, redo, the text
  alignments and indents) mirror by themselves in `@qeetrix/icons` 2.0: the base styles turn them.
- **Your own arrows:** arrows and chevrons are drawn in their physical orientation and never
  mirror on their own. When an icon you pass means forward or back, opt in with `mirrorInRtl`:

```tsx
import { ArrowRightIcon } from "@qeetrix/icons/icons/arrow-right";
import { Button, mirrorInRtl } from "@qeetrix/react";

<Button icon={mirrorInRtl(ArrowRightIcon)}>Continue</Button>   // points forward in both directions
```

## Formatting

Plain functions, in `en-IN` by default, that work on the server too:

```ts
import {
  formatCurrency, formatDate, formatDateTime, formatNumber, formatRelativeTime,
} from "@qeetrix/react";

formatCurrency(124500, "INR");                            // "₹1,24,500.00"
formatNumber(1234567);                                    // "12,34,567"
formatDate(at);                                           // "25 Oct 2026"
formatDate(at, "en-IN", { dateStyle: "long" });           // "25 October 2026"
formatDateTime(at);                                       // "25 Oct 2026, 3:00 pm" (India time)
formatDateTime(at, "hi-IN");                              // "25 अक्टू॰ 2026, 3:00 pm"
formatDateTime(at, "en-IN", { timeZone: "UTC" });         // "25 Oct 2026, 9:30 am"
formatRelativeTime(updatedAt, "en-IN", now);              // "2 minutes ago"
```

Dates are Gregorian and shown in India time (`Asia/Kolkata`) unless you pass a `timeZone`.

## Experimental: the console frame

Components and patterns in their first product ship from `@qeetrix/react/experimental`. They may
change in a patch release, always with a changelog note, until they're stable.

| Area | Components |
|:--|:--|
| **Console frame** | `AppShell`, `TopBar` (`TopBarSwitcher`, `TopBarSearch`), `Sidebar` (`SidebarGroup`, `SidebarItem`), `PageHeader` (`PageHeaderBack`), `PageContent`, `Breadcrumb` |
| **Forms and input** | `Form`, `ErrorSummary`, `Combobox` (with server search), `SearchField`, `NumberField`, `PasswordInput`, `OTPInput`, `FileUpload`, `FilterTags`, `Chip` (`ChipGroup`) |
| **Dates** | `Calendar`, `RangeCalendar`, `DatePicker`, `DateRangePicker` (with presets) |
| **Data display** | `Stat` (`StatGroup`), `DescriptionList`, `Timeline`, `TreeView`, `AvatarGroup`, `AvatarItem`, `CodeBlock`, `QRCode` |
| **Feedback** | `Alert`, `EmptyState`, `DataState`, `Steps`, `Pagination` |
| **Actions** | `CopyButton`, `CommandPalette`, `ThemeSwitcher`, `ProviderButton` (`ProviderButtonGroup`) |

```tsx
import {
  AppShell, PageContent, PageHeader, Sidebar, SidebarGroup, SidebarItem, Stat, StatGroup,
  TopBar, TopBarSearch, TopBarSwitcher,
} from "@qeetrix/react/experimental";
import { Button, Menu, MenuContent, MenuTrigger } from "@qeetrix/react";

<AppShell
  topBar={
    <TopBar
      logo={<QeetLogo variant="dark" height={20} />}
      product="Qeet ID"
      context={
        <>
          <Menu>
            <MenuTrigger render={<TopBarSwitcher mark="AC" label="Acme Pvt Ltd" />} />
            <MenuContent>{organisations}</MenuContent>
          </Menu>
          <TopBarSwitcher status="success" label="Production" />
        </>
      }
      search={<TopBarSearch placeholder="Search or jump to…" shortcut={["⌘", "K"]} onClick={openPalette} />}
      account={accountMenu}
    />
  }
  sidebar={
    <Sidebar label="Qeet ID">
      <SidebarGroup label="Directory">
        <SidebarItem label="Users" icon={UsersIcon} current render={<Link to="/users" />} />
      </SidebarGroup>
    </Sidebar>
  }
  drawers={[{ id: "help", label: "Help", icon: CircleQuestionMarkIcon, content: help }]}
>
  <PageHeader
    title="Users"
    actions={<Button icon={PlusIcon}>Invite users</Button>}
    summary={
      <StatGroup>
        <Stat label="Total users" value={1284} note="+38 this week" tone="positive" trend={weekly} />
      </StatGroup>
    }
  />
  <PageContent>{table}</PageContent>
</AppShell>
```

The bar is black in light and dark, topped by a 2px Ember line; the navigation collapses to a 48px
rail that expands while hovered. The secure-entry parts handle secrets and codes:

```tsx
<Alert tone="warning" title="Copy this client secret now">It can't be shown again.</Alert>
<Field label="Client secret">
  <PasswordInput readOnly autoComplete="off" defaultValue={secret}
    endAdornment={<CopyButton value={secret} label="Copy client secret" size="sm" />} />
</Field>
<Field label="Verification code"><OTPInput size="lg" onValueComplete={verify} /></Field>
```

The theme switch and the sign-in providers look and behave the same in every product. The
providers' logos are your own artwork (e.g. `@thesvg/react`); Qeetrix ships none:

```tsx
<ThemeSwitcher />  {/* QeetrixProvider's scheme, in a menu; variant="segmented" for three toggles */}

<ProviderButtonGroup aria-label="Sign in with another account">
  <ProviderButton logo={<Google />} aria-label="Sign in with Google" onClick={signInWithGoogle}>
    Google
  </ProviderButton>
  <ProviderButton logo={<Apple />} logoInvert="light" aria-label="Sign in with Apple"
    render={<a href="/oauth/apple" />}>
    Apple
  </ProviderButton>
</ProviderButtonGroup>
```

## Entry points and server components

- **ESM only,** with types for every entry point.
- **Per-component entry points:** `@qeetrix/react/stack`, `@qeetrix/react/dialog` and so on, plus
  `@qeetrix/react/experimental` and `@qeetrix/react/locales/hi`.
- **Server-safe:** layout, type, `Link`, `Spinner`, `Card`, `Table`, `Badge`, `Skeleton` and the
  formatting functions render in React Server Components. Everything built on Base UI is a client
  component; its `"use client"` directive ships in the build.
- **`render` prop:** renders a different element with the same props, e.g. `render={<section />}`,
  or your router's `Link`.

## Accessibility

- **Patterns:** interactive components follow Base UI's WAI-ARIA patterns: focus management,
  keyboard support, and right-to-left arrow keys.
- **Labels by type:** a label that can't be inferred is required by the type. `IconButton` won't
  compile without an `aria-label`.
- **Tested in real browsers:** every component runs axe in its tests, and forced colours (Windows
  High Contrast), reduced motion, right to left and server rendering have suites of their own.
- **Contrast:** colours come from tokens whose contrast pairs are tested, AA or better.

**Browser support:** Chrome and Edge 111+, Firefox 128+, Safari and iOS Safari 16.4+.

## Versioning

While the package is `0.x`:
- **A patch** adds a component, a prop, a value or a fix.
- **A minor** removes or renames an export, prop, variant, slot or CSS class, changes what one
  means, or changes a public type.
- **Experimental** components may change in a patch, always with a changelog note.

Every change is listed in the
[changelog](https://github.com/qeetgroup/qeetrix-react/blob/main/packages/react/CHANGELOG.md), with a
migration note when one is needed.

## License

[MIT](https://github.com/qeetgroup/qeetrix-react/blob/main/LICENSE) © Qeet Group
