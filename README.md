<div align="center">

# Qeetrix React

**The React components of Qeetrix, the Qeet Group design system.**

Accessible, token-driven components built on [Base UI](https://base-ui.com), made for the consoles
and products of Qeet Group, in English and Hindi, light and dark, left to right and right to left.

[![npm](https://img.shields.io/npm/v/@qeetrix/react?label=%40qeetrix%2Freact&color=d04800)](https://www.npmjs.com/package/@qeetrix/react)
[![CI](https://github.com/qeetgroup/qeetrix-react/actions/workflows/ci.yml/badge.svg)](https://github.com/qeetgroup/qeetrix-react/actions/workflows/ci.yml)
[![CodeQL](https://github.com/qeetgroup/qeetrix-react/actions/workflows/codeql.yml/badge.svg)](https://github.com/qeetgroup/qeetrix-react/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/qeetgroup/qeetrix-react/badge)](https://scorecard.dev/viewer/?uri=github.com/qeetgroup/qeetrix-react)
[![React 19](https://img.shields.io/badge/React-19-149eca)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

[Package docs](packages/react/README.md) · [Changelog](packages/react/CHANGELOG.md) ·
[Storybook](https://github.com/qeetgroup/qeetrix-story) · [Design tokens](https://github.com/qeetgroup/qeetrix-tokens) ·
[Icons](https://github.com/qeetgroup/qeetrix-icons) · [ui.qeet.in](https://ui.qeet.in)

</div>

---

## Why Qeetrix React

| | |
|:--|:--|
| ♿ **Accessible by default** | Interactive parts are built on Base UI's WAI-ARIA patterns. Every component is tested with axe, in forced colours and under reduced motion. A label that can't be inferred is required by the type. |
| 🎨 **Tokens, never raw values** | Colours, type, spacing, corners, shadows and motion all come from [`@qeetrix/tokens`](https://github.com/qeetgroup/qeetrix-tokens). A source check rejects anything else, so every product looks the same. |
| 🇮🇳 **Made for India** | Hindi strings ship in the box. Numbers, rupees and dates format for `en-IN` and `hi-IN`, in India time by default. |
| 🌗 **Every mode** | Light and dark, three densities (compact, default, comfortable) and right to left, switched with attributes your app already owns. |
| ⚡ **Light to load** | ESM only, one entry point and one stylesheet per component, a precompiled stylesheet in cascade layers, size budgets enforced in CI. |
| 🖥️ **Server-friendly** | Layout, type and display components render in React Server Components; the rest ship their own `"use client"`. |
| 🔒 **Built to be trusted** | Published with npm provenance, scanned by CodeQL and OpenSSF Scorecard, and every public API change is tracked in an API report. |

## Quick start

```bash
bun add @qeetrix/react @qeetrix/tokens @base-ui/react @qeetrix/icons
```

```css
/* Once, in your root stylesheet: the tokens first. */
@import "@qeetrix/tokens";
@import "@qeetrix/react/styles.css" layer(components);
```

```tsx
import { PlusIcon } from "@qeetrix/icons/icons/plus";
import { Button, QeetrixProvider, Stack, TextField, ToastProvider } from "@qeetrix/react";

export function App() {
  return (
    <QeetrixProvider locale="en-IN" defaultColorScheme="system">
      <ToastProvider>
        <Stack gap="lg">
          <TextField label="Work email" name="email" type="email" required />
          <Button icon={PlusIcon}>Invite users</Button>
        </Stack>
      </ToastProvider>
    </QeetrixProvider>
  );
}
```

The [package README](packages/react/README.md) covers styles, forms, overlays, locales, right to
left, formatting and the console frame in depth.

## What's inside

### Stable: `@qeetrix/react`

| Area | Components |
|:--|:--|
| **Layout** | `Box`, `Stack`, `Inline`, `Grid` · `GridItem`, `Card`, `Separator`, `ScrollArea` |
| **Type** | `Heading`, `Text`, `Link`, `SkipLink`, `VisuallyHidden` |
| **Actions** | `Button`, `IconButton`, `Toggle` · `ToggleGroup` |
| **Forms** | `TextField`, `Field`, `Fieldset`, `Input`, `Textarea`, `Checkbox` · `CheckboxGroup`, `Radio` · `RadioGroup`, `Switch`, `Select`, `Slider` |
| **Overlays** | `Dialog`, `Drawer`, `Popover`, `Tooltip`, `Menu`, `ContextMenu`, `ToastProvider` · `useToast` |
| **Navigation and disclosure** | `Tabs`, `Accordion`, `Collapsible` |
| **Display and status** | `Table`, `Badge`, `Avatar`, `Progress`, `Meter`, `Spinner`, `Skeleton` |
| **Foundations** | `QeetrixProvider` · `useColorScheme` · `useLocale`, `mirrorInRtl`, `formatCurrency`, `formatNumber`, `formatDate`, `formatDateTime`, `formatRelativeTime` |

### Experimental: `@qeetrix/react/experimental`

Components in their first product. Their API may change in a patch release, always with a changelog
note.

| Area | Components |
|:--|:--|
| **Console frame** | `AppShell`, `TopBar`, `Sidebar`, `PageHeader` · `PageHeaderBack`, `PageContent`, `Breadcrumb` |
| **Forms and input** | `Form`, `ErrorSummary`, `Combobox`, `SearchField`, `NumberField`, `PasswordInput`, `OTPInput`, `FileUpload`, `FilterTags` |
| **Dates** | `Calendar`, `RangeCalendar`, `DatePicker`, `DateRangePicker` |
| **Data display** | `Stat` · `StatGroup`, `DescriptionList`, `Timeline`, `TreeView`, `AvatarGroup`, `AvatarItem`, `CodeBlock`, `QRCode` |
| **Feedback** | `Alert`, `EmptyState`, `DataState`, `Steps`, `Pagination` |
| **Actions** | `CopyButton`, `CommandPalette`, `ThemeSwitcher`, `ProviderButton` · `ProviderButtonGroup` |

Browse every component, live, in the [Qeetrix Storybook](https://github.com/qeetgroup/qeetrix-story).

## The Qeetrix family

| Repository | Package | What it is |
|:--|:--|:--|
| **qeetrix-react** (this) | [`@qeetrix/react`](https://www.npmjs.com/package/@qeetrix/react) | The React components |
| [qeetrix-tokens](https://github.com/qeetgroup/qeetrix-tokens) | [`@qeetrix/tokens`](https://www.npmjs.com/package/@qeetrix/tokens) | Design tokens: CSS variables, DTCG files, `brandTheme()` for a tenant's colour |
| [qeetrix-icons](https://github.com/qeetgroup/qeetrix-icons) | [`@qeetrix/icons`](https://www.npmjs.com/package/@qeetrix/icons) | Icons in round and sharp, and the Qeet logos |
| [qeetrix-story](https://github.com/qeetgroup/qeetrix-story) | — | The Storybook workshop: every component, foundation and console pattern |

Pair `@qeetrix/react` with a `@qeetrix/tokens` version its peer range names: 0.2.1 takes any
0.0.x from 0.0.10.

## Quality bar

Every pull request into `main` runs the whole gate. Nothing merges red.

| Gate | What it checks |
|:--|:--|
| **Build** | tsdown (unbundled ESM, component names kept) and Lightning CSS |
| **Types and lint** | `tsc` strict, Biome, and the React Compiler's lint rules |
| **Source check** | Tokens-only CSS (no raw colours, radii, shadows, type or z-index), logical properties, client boundaries |
| **Dist check** | Size budgets per component, entry points, names that survive the build |
| **API report** | [API Extractor](https://api-extractor.com) tracks every export; a removed or changed line needs a raised version |
| **Package** | `publint --strict` and Are The Types Wrong, for an ESM-only package |
| **Tests** | Vitest in real browsers via Playwright: Chromium with coverage on every PR, and Chromium, Firefox and WebKit nightly. axe, forced colours, reduced motion, right to left and server rendering are all tested. |
| **Security** | CodeQL and OpenSSF Scorecard |

**Browser support:** Chrome and Edge 111+, Firefox 128+, Safari and iOS Safari 16.4+.

## Development

Needs [Bun](https://bun.sh) 1.3.14 and Node 22+.

```bash
bun install
bun run build            # the package and its stylesheets
bun run typecheck
bun run lint             # Biome
bun run lint:compiler    # React Compiler lint rules
bun run check            # source, dist, API report and package checks
bun run test             # real-browser and server tests
bun run test:coverage
```

```text
qeetrix-react/
├── packages/react/          @qeetrix/react
│   ├── src/                 one folder per component family, experimental/, locales/
│   ├── tests/               cross-cutting suites: server rendering, RTL, forced colours, motion
│   ├── etc/react.api.md     the API report
│   ├── scripts/             build-css, check-source, check-dist
│   └── size-budget.json     per-component size budgets
├── scripts/                 the API version check, npm version helpers
├── tools/eslint/            React Compiler lint
└── .github/workflows/       ci, codeql, scorecard, version, release, rollback
```

## Releases

- **Branches:** work lands on `develop`; a pull request from `develop` into `main` releases it.
- **Versions:** `version.yml` raises the patch on that pull request unless the version was already
  raised by hand. A minor or major is set by hand in `packages/react/package.json`, with its own
  section in the [changelog](packages/react/CHANGELOG.md).
- **Publishing:** merging into `main` runs `release.yml`, which publishes to npm with provenance,
  tags `vX.Y.Z` and opens a GitHub Release. If a release is bad, `rollback.yml` points npm's
  `latest` tag back at a known-good version (published versions are never removed).

## Contributing and security

- **Rules, conventions and commands:** [AGENTS.md](AGENTS.md).
- **Security issues:** report them privately, as [SECURITY.md](SECURITY.md) describes, never in a
  public issue.

## License

[MIT](LICENSE) © Qeet Group
