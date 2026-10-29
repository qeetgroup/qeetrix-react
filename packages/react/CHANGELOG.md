# @qeetrix/react

## 0.2.1

Installs beside the released `@qeetrix/tokens` 0.0.10 and `@qeetrix/icons` 2.0.0. No component
changes.

- **Peer `@qeetrix/tokens` is `>=0.0.10 <0.1.0`** (was `^0.0.9`). On a 0.0.x version a caret
  range allows only that version, so 0.2.0 next to tokens 0.0.10 failed npm's install with
  `ERESOLVE`. The range now takes every 0.0.x from 0.0.10, the version the components are tested
  against: its font subsets, plain `tokens.css` and re-stepped categorical colours need no change
  here.
- **`@qeetrix/icons` is `^2.0.0`** (was `^1.0.12`, which installed 1.0.13). The 18 icons that point
  a reading direction (log-in, send, undo, …) now carry `data-qx-mirror`, which the base styles'
  `[dir="rtl"] [data-qx-mirror]` rule already turns in right-to-left. Arrows and chevrons are
  unchanged: they still mirror only through `mirrorInRtl()`.

## 0.2.0

Fixes and additions from the Qeet ID console's Jira issues (QTRX). Nothing is removed or renamed.
A minor, not a patch: one default changes (a MenuRadioItem closes its menu on a choice), and three
props interfaces that were empty gained props, which the API check counts as changed lines.

### Migrating from 0.1

- **A menu of `MenuRadioItem`s now closes on a choice.** A menu where several settings change in
  a row passes `closeOnClick={false}` on its items. A closed menu unmounts its items, so a picker
  holds its value in state (`value` / `onValueChange` on MenuRadioGroup).
- **Navigation styled as a button:** move `<Button render={<RouterLink … />}>` to
  `<LinkButton render={<RouterLink … />}>`, which is announced as a link.
- **Routed sub-page tabs:** move Tabs that navigate in `onValueChange` to `TabNav` and
  `TabNavLink`.
- **A Tooltip has a pointer, 8px from its trigger** (it was 6px with none). A layout that relied
  on 6px passes `sideOffset={6}`.
- Nothing else needs a change.

### New

- **`LinkButton`** (QTRX-8): navigation drawn as a Button. It renders a plain link, `<a href>` or
  the router link given in `render` (`render={<RouterLink to="/users" />}`), with Button's
  `variant`, `tone`, `size`, trailing `icon` and `fullWidth`. It keeps a link's semantics: it's
  announced as a link, with no `role="button"`, `type` or `tabindex`; Enter follows it, and it can
  be opened in a new tab. Server-safe. A Button given a link in `render` is still announced as a
  button, so use LinkButton for navigation.
- **`TabNav` and `TabNavLink`** (QTRX-19): tabs for sub-pages that are pages of their own, drawn
  as a TabsList. A `<nav>` (its `aria-label` required) of links: the current one is
  `aria-current="page"` (from `current`, or set by a router link) and carries the weight and the
  3px Ember bar. `icon`, `filledWhenSelected`, `badge` and `render` as Tab's. It goes in
  PageHeader's `tabs` as a TabsList does. Tabs stay for views within one page.
- **The `qx.state` layer** (QTRX-46): after `qx.components`, holding one rule: the `hidden`
  attribute hides any Qeetrix part, whatever display its component sets (`hidden="until-found"` is
  left alone). Every per-family stylesheet (`dist/css/<family>.css`) now declares the three layers
  first and imports `state.css`.
- **Table: `table-toolbar`** (QTRX-17): the toolbar sits in its own slot, which fills the bar and
  wraps, so a search and filters use the table's width.

- **Meter: `target`** (QTRX-14): a goal on the range, drawn as a 2px tick that overhangs the track,
  placed from the start edge (it mirrors in right-to-left), and read out with the value: "40%,
  target 80%" (`messages.meter.withTarget`).
- **Table:**
  - **`rowSelectable` and `rowUnselectableReason`** (QTRX-16): a row that can't be selected has a
    disabled checkbox, described by the reason; the header's checkbox selects, clears and counts
    only the selectable rows.
  - **`currentRow`** (QTRX-70): the row whose record is open beside the list: `aria-current` and
    the selected tint.
  - **`rowActions` returning nothing** leaves that row without its menu button (QTRX-69); the
    column stays.
  - **Column `priority`** (QTRX-58): `low` columns hide while the table is narrower than 640px,
    `medium` under 480px (container queries); `high`, the default, always shows.
  - **It scrolls sideways itself** when wider than its space (QTRX-67): the table sits in a
    `table-scroll` wrapper that, only while it overflows, scrolls and is a region named for the
    table, in the tab order. It doesn't scroll otherwise, so the sticky header keeps sticking to
    the page. No ScrollArea is needed around a Table.
- **Select: an item's `meta`** (QTRX-20): a short fact at the option's end, such as a count, in
  subtle tabular figures; read out with the option, not shown in the closed trigger.
- **DrawerFooter and DialogFooter: `start`** (QTRX-23): a quiet link or a one-line summary at the
  footer's start, the actions staying at its end; it wraps where there's no room.
- **Stat: `currency` and `format`** (QTRX-41): money formatted for the locale, a whole amount with
  no fraction: `<Stat value={1842600} currency="INR" />` reads ₹18,42,600 in en-IN.
- **PageHeader: `headingLevel`** (QTRX-82): the title's level, default `1`, so a PageHeader shown
  inside another page (a docs example, a preview in a drawer, a summary in a dialog) keeps that
  page's outline. It looks the same at every level.
- **Collapsible: a turning chevron** (QTRX-81): a Button or IconButton rendered by
  CollapsibleTrigger with `icon={ChevronDownIcon}` turns its chevron 180° as the panel opens, with
  the accordion's timing; under reduced motion it turns at once.
- **PageHeader: `leading`** (QTRX-48): a record's logo or Avatar before its title and description,
  its top on the title's first line, outside the heading.

- **Pagination: a cursor mode, and `ShowMore`** (QTRX-57): for a cursor API, `hasPrevious` /
  `hasNext` with `onPrevious` / `onNext` give Previous and Next alone (no First or Last), the range
  shown when the page knows its `offset`. `ShowMore` appends the next page of a growing list ("Show
  older events") and, once there's nothing more, says so (`end`), announced politely.
- **Combobox: `allowCustom`** (QTRX-66): while what's typed matches no option, the list offers it
  ("Use “subject.department”") and choosing it sets the text as the value. String values, flat items.
- **Select: `size`** (QTRX-72): `md` and `sm` sit beside Buttons of that size in a toolbar; `lg`, a
  form field's height, stays the default.
- **Field: a function child** (QTRX-73): for a control that isn't a form input (a rich-text editor,
  a ToggleGroup), it receives `aria-labelledby`, `aria-describedby` and `aria-invalid` to spread on
  it (`FieldControlProps`), so the label, description and error name and describe it.
- **DescriptionItem: `description` and `action`** (QTRX-74): a sentence under the value and an
  action at the row's end (in its own `dd`): a Settings row.
- **Steps: a step's `status`** (QTRX-80): `failed` (a danger marker with ×) or `attention` (a
  warning marker), read after the name ("Verify the record, Failed"), or `done` / `current` /
  `upcoming` set outright, so a later step can stay done while an earlier one needs work.
- **AppShell panels: `width`, `minWidth`, `maxWidth`, `resizable`, `onWidthChange`** (QTRX-75): a
  panel's width, and a window-splitter handle on its start edge (drag it, or use the arrow keys,
  Home and End), the right way round in right-to-left.


New experimental families and parts (from `@qeetrix/react/experimental` unless named):

- **Small charts** (QTRX-13, 63, 77, 78, 79), in the data-viz colours with 2px gaps and 2px data
  ends, text in text colours: **`Sparkline`** (decoration, or an image with `label`), **`ShareBar`**
  (parts of a whole; an image named for its parts, or with a `legend` whose items can link),
  **`ColumnChart`** (a stacked column a period on one scale, named for its busiest period; columns
  can link), **`BarList`** (ranked amounts, largest first), **`SpanChart`** (spans on one time
  axis, each said in words), and **`ChartTooltip`** and **`ChartLegend`** for a chart library's
  slots, titled from the point.
- **`Treemap`** and **`ProportionalCircles`** (QTRX-24): parts of a whole. A squarified treemap
  (`squarify` is exported) nested one level, in two sequential tints by depth and graphite for
  what has no group; a tile's link is its header stretched over the tile, its name listing the
  children. Circles whose area is true to the value (a radius floor), a row per group, the count
  inside a circle that holds it, each said in words.
- **Stat: `chart` and `action`** (QTRX-18): a small chart under the note and a link into the list,
  for a PageHeader summary band's richer cells; StatGroup keeps the gutter and the rules.
- **`MultiEmailField`** (QTRX-22): several addresses, typed, pasted or separated by commas, spaces
  or new lines, each a ruled row with its state from `check` ("Already a member") and a remove
  button; Backspace removes the last; `max` keeps the rest in the box and says so; changes are
  announced.
- **`ColorSwatchGroup`** and **`ColorField`** (QTRX-52): a radio group of named swatches (token or
  hex), the chosen one ringed; a hex field whose swatch is the system picker, with the eyedropper
  where the browser has one, `suggestions`, a `resetLabel` and a `contrast` line that warns under
  4.5:1. `toHexColor` and `contrastRatio` are exported.
- **`CodeField`** (QTRX-59): code to edit inside a Field, coloured as it's typed, with line
  numbers; Tab indents, Shift+Tab outdents, Escape then Tab leaves.
- **`Composer`**, **`Conversation`** and **`Turn`** (QTRX-76): an assistant's message field (Enter
  sends, Shift+Enter adds a line, Send becomes Stop), a polite log that follows new turns while
  you're at the bottom, and turns that name their speaker for screen readers.
- **`Toolbar`** (with `ToolbarButton`, `ToolbarGroup`, `ToolbarSeparator`) and **`Workspace`**
  (with `WorkspacePane`, `WorkspaceMain`, `WorkspaceOutput`) (QTRX-64): one Tab stop and arrow keys
  across a tool's actions; ruled panes edge to edge with output docked under the canvas, stacking
  in a narrow box.
- **`GraphCanvas`** (QTRX-65): a layered tree top down with elbow lines and their relation, zoom and
  fit, one Tab stop with the arrow keys along the tree, each node saying what it's reached from.
- **`FloatingPanel`** (QTRX-53): a non-modal panel moved by its head and resized from its corner,
  by pointer or arrow keys, kept in the window, mirrored right to left, its place remembered
  (`storageKey` or `onPlaceChange`), put back on a double-click; a bottom sheet on narrow screens.
- **`SiteHeader`**, **`SiteNav`**, **`SiteNavItem`** and **`SiteNavLink`** (QTRX-12): a website's
  bar on the Ember line, its sections with panels (arrow keys, Escape back to the trigger) and the
  current one's Ember bar, utilities and one primary action; a menu on narrow screens.
- **`Kbd`** (QTRX-28), **`RelativeTime`** (QTRX-56), **`CopyField`** (QTRX-55), **`CheckList`**
  (QTRX-60), **`InstructionList`** (QTRX-61) and **`StateRuler`** (QTRX-62).
- **Table: tree rows** (QTRX-25): `rowDepth`, `rowHasChildren`, `expanded` / `defaultExpanded` /
  `onExpandedChange` and `rowPath`. A fold button sits before the row link (so `rowHref` still
  works); the table is a tree grid (`aria-level`, `aria-expanded`, `aria-posinset`, `aria-setsize`;
  ← folds, → opens, ↑ and ↓ move); the page's first row says where it continues from.
  `foldTreeRows` pages the rows that show.
- **Table: `stickyFirstColumn`** (QTRX-68): the first column stays while a matrix scrolls
  sideways; header cells hold links or buttons in the header's look; `align: "center"` centres a
  checkbox.
- **Sidebar levels** (QTRX-43, 45): two levels of categories, the current page opening every one
  around it, the filter searching the whole tree, each level stepping in on a guide line; a
  category with an `href` is a page too, with its own fold button.
- **AppShell: `embedded`** (QTRX-38): a shell inside a page fills its box, with no `<main>` or skip
  link; its layout follows the box's width and its navigation drawer opens inside it.
- **`PortalContainer`** (QTRX-47), from the root: popups inside it (menus, popovers, selects,
  tooltips, comboboxes, dialogs, drawers) render into a given element, such as a native modal
  `<dialog>`, instead of the body.
- **`colorSchemeScript()`** and **QeetrixProvider `storageKey`** (QTRX-30): one inline script sets
  the saved scheme before the first paint, a fixed string a CSP can allow by hash; the provider
  starts from the same saved choice and saves new ones under the same key.
- **`@qeetrix/react/manifest`** (QTRX-39): every family, its status, kind, the version it arrived
  in, its entry point and its parts. `bun run manifest` regenerates it; a test fails while it's out
  of date.
- **CodeBlock: CSS, and highlighting without React** (QTRX-29): `css` is a language; `highlight`
  (tokens) and `highlightHtml` (HTML in the code colours) are exported for static pages.

### Changed

- **Tooltip: a pointer** in the middle of the side facing the trigger, a sharp 10 × 5px triangle in
  the tooltip's graphite that follows the trigger when the popup shifts to stay on screen, and
  mirrors with the side. The default `sideOffset` is 8px (was 6), the pointer filling 5 of them.
- **ThemeSwitcher, the one theme control** (QTRX-44): the menu's current choice is marked by an
  Ember check, the menu is 9.5rem wide, and `menuSide="top"` opens it upward at the foot of the
  navigation or a page. With QeetrixProvider's `storageKey="qx-color-scheme"` the choice is saved
  for `colorSchemeScript`.
- **CodeBlock is server-safe**: the code is highlighted where it renders, and only its Copy button
  and strings hydrate.
- **`MenuRadioItem` closes its menu on a choice** (QTRX-42), as a menu that picks one value should.
  Pass `closeOnClick={false}` where several settings change in a row. A closed menu unmounts its
  items, so hold the value in state (`value` / `onValueChange` on MenuRadioGroup).

### Fixed

- **Link rendered as a button** (QTRX-71): it drops the button's box (border, padding, background),
  so an action in place reads as a link.
- **Table:** a row link (or row button) is named by `rowLabel(row)`, as its checkbox and actions
  button are, and described by the rest of the primary cell (QTRX-21): "Priya Sharma, link", not
  everything the cell shows.
- **Tabs:** the selected tab carries the Ember bar from the first paint (QTRX-49). Before Base UI
  measures the sliding indicator (on the server, before hydration) the tab draws the bar itself.
- **Dialog and Drawer:** opened from the keyboard with nothing to fill in, they close on the first
  Escape (QTRX-54). Their Close button shows no tooltip, which had taken the first Escape.
- **Avatar:** a company's legal form doesn't count towards its initials (QTRX-40): "Kaveri Foods
  Private Limited" is KF, and a name left with one word takes its first two letters, so "Acme Pvt
  Ltd" is AC (it was AL). Pvt, Private, Ltd, Limited, LLP, OPC, Inc, LLC, PLC, Corp, Co, GmbH, Pte
  and Pty, with or without dots.
- **Heading:** the display sizes use the Geo letterforms (QTRX-36), as design rules §5 give them.
- **FilterTags:** its docs say what it does with no filters (QTRX-15): it shows the summary alone,
  for a search that narrows the list without a tag, and nothing without a summary.
- **Package:** a family can hold its own JavaScript budget (`familyJsByFamily` in
  size-budget.json); Table's is 6.3 kB gzip (tree rows, tree-grid keys and the sticky column
  included), the rest stay at 4.

## 0.1.3

Two experimental components for every product's header, footer and sign-in page, from the Qeet ID
console's local copies. Nothing is removed or renamed, and the root entry's API is unchanged.

### New (experimental)

- **`ThemeSwitcher`:** Light, Dark or System, the same switch in every product.
  - **`variant="menu"`** (default): a neutral ghost IconButton showing the current choice's icon
    (Sun, Moon or Monitor), named "Theme" and showing that as its tooltip. Its compact menu (10rem,
    not a menu's 200px) lists the three, each with its sharp icon; the current one is a checked
    `menuitemradio` marked by a check at the end, with no radio dot. Choosing closes the menu.
  - **`variant="segmented"`:** a ToggleGroup of three icon-only toggles, each named by its label
    and showing it as a tooltip; the pressed one draws its filled icon.
  - **State:** by default it reads and sets the enclosing QeetrixProvider's scheme
    (`useColorScheme`). `value` / `defaultValue` / `onValueChange` (`"light" | "dark" | "system"`)
    detach it and manage the scheme yourself. One choice is always made: choosing the current one
    again changes nothing and isn't reported.
  - Also `size`, `disabled`, `tooltipSide` and `messages`. It renders the provider's scheme on the
    server and hydrates without a mismatch. In development it warns when nothing manages the
    scheme.
- **`ProviderButton` and `ProviderButtonGroup`:** the ruled row of "Continue with Google /
  Microsoft / Apple" buttons.
  - **`ProviderButtonGroup`:** a `<fieldset>` named by its required `aria-label`, on the raised
    surface with a 1px border, 4px corners and 1px rules between equal cells, and no fieldset
    chrome. The whole row is the field height (`size.control.lg`). Server-safe.
  - **`ProviderButton`:** a `logo` slot (apps pass the provider's own artwork; Qeetrix ships no
    third-party logos), the provider's name as its visible label, and a required `aria-label` for
    the whole phrase ("Sign in with Google"). `disabled` keeps it focusable with `aria-disabled`, as
    Button does. `render` makes it a link (`render={<a href="/oauth/google" />}` or a router link).
    Hover and pressed are neutral tints; the Ember focus frame sits inside the cell.
  - **`logoInvert`** (`"light"` or `"dark"`) inverts a monochrome logo in the scheme where it would
    vanish (Apple's white mark in light, GitHub's black mark in dark), following the nearest
    `data-qx-color-scheme`. A `data-invert` attribute inside `logo` does the same for one part.

### Strings

- A new catalogue group, `themeSwitcher`: `label` "Theme", `light` "Light", `dark` "Dark",
  `system` "System". The Hindi pack has it too.

## 0.1.2

Documentation only: no code changes.

- **README rewritten** for 0.1.x. It covers every stable and experimental component; a data-driven
  `Table` example; theming (colour scheme, density, a tenant's brand); `mirrorInRtl` and right to
  left; the date helpers with real outputs; accessibility; browser support; and the versioning
  rules. The repository README is the project's front page now.

## 0.1.1

Right-to-left arrows and consistent icon sizes, from the Storybook review. Nothing is removed or
renamed.

**Pair it with `@qeetrix/tokens` 0.0.9:** Badge reads its new `--qx-size-icon-2xs` token, so the
peer range is now `^0.0.9`.

### New

- **`mirrorInRtl(Icon)`:** an icon that points a reading direction, mirrored under `dir="rtl"`:
  `<Button icon={mirrorInRtl(ArrowRightIcon)}>Continue</Button>` points forward in both directions.
  `@qeetrix/icons` draws arrows and chevrons in their physical orientation and never mirrors them,
  so whether one means forward or back is decided at the call site, once per icon. It returns the
  same component for the same icon, and it's server-safe.

### Fixed

- **Link:** the external-link arrow mirrors in right to left, pointing up and toward the reading end.
- **Badge:** its icon is sized by `--qx-size-icon-2xs`, the icon scale's new 12px step, instead of
  a number in its CSS. It looks the same.
- **Toast:** its icon is 16px, Alert's size for the same job (it was 18px, off the icon scale), and
  sits centred on the title line (the 18px icon sat 2px high). The loading spinner's box follows.

### Security

- **Link:** the last word is found with a scan, not a regular expression that backtracked on a long
  run of text without spaces (CodeQL `js/polynomial-redos`).

## 0.1.0

Fixes and new variants from the Storybook review of 0.0.8: every bug, accessibility and alignment
finding on the React side, the variants an enterprise console needs, and consistency across
components. Pair it with `@qeetrix/tokens` 0.0.8, which fixes the colour-contrast findings.

**Migration:** none needed. Nothing was removed or renamed. A few unions gained values
(`DialogSize`, `MeterTone`, `SpinnerTone`), which only matters to code that switches over them
exhaustively. Behaviour changes are listed under **Changed**.

**Why 0.1.0:** CI's API check needs a minor bump whenever a public type changes, and these
unions changed. Nothing breaks.

### New

- **`Avatar` `shape`:** `"circle"` (default) or `"square"`, for organisations, applications and
  tenants; passed through `AvatarGroup` and `AvatarItem`.
- **`Badge` `variant` and `size`:** `variant="solid"` (the bold fill, AA in every tone and scheme)
  next to `subtle`, and `size="sm"` (16px) next to `md`.
- **`Card` `variant` and `tone`:** `variant="subdued"` (the sunken surface) for secondary panels,
  and `tone="danger"` (a danger border and title) for destructive settings.
- **`GridItem`:** a Grid cell that spans columns, `span` and `start`, both responsive by window
  size class, for a main column and a side column. Server-safe.
- **`Table` clickable rows:**
  - `rowHref`, `renderRowLink` (for a router) and `onRowClick`, with `primary` on a column;
  - the primary cell holds the row's one link or button, and a click anywhere else on the row
    follows it (not on its controls, its menu, or selected text).
- **`TreeNode` `disabled`:** skipped by the keys, never selected or ticked.
- **`Timeline` tones:** `brand` and `info`, matching Badge.
- **`Stat` `loading`:** placeholders that hold the value's place.
- **`Meter` and `Progress` tones:** Meter gains `neutral` and `info`; Progress gains `tone`
  (`brand`, `success`, `danger`).
- **`Skeleton` `lines` and `size`:** a paragraph preset, and circles that match Avatar's sizes.
- **`formatDate` and `formatDateTime`:** Gregorian, `en-IN` by default, India time by default, from
  a Date, a timestamp, "YYYY-MM-DD" or an ISO date-time.
- **`Dialog` sizes:** `xl` (1120px) and `fullscreen`.
- **`Drawer` `dismissible`:** like Dialog's.
- **`ContextMenu`, `ContextMenuTrigger`:** right-click, Shift+F10 and the context-menu key, with
  every Menu part.
- **`MenuItem` `description`:** a second, subtle line under the label, also on checkbox and radio
  items.
- **Tooltip placement:** `Tooltip` `sideOffset`; `IconButton` and `Toggle` `tooltipSide`; `Toggle`
  `tooltip`.
- **`PopoverContent` naming:** `aria-label` and `aria-labelledby`, for a popover without a title.
- **`TextField` `help`:** the ⓘ explanation, like Field's.
- **`Slider` `description` and `error`:** like the choice groups.
- **`ErrorSummary` and `Form` headings:** ErrorSummary gets `headingLevel` and `autoFocus`, and
  Form gets `summaryHeadingLevel`.
- **`Tabs`:** `TabsList` `variant="contained"`, a segmented strip, and `Tab` `badge`, a count
  formatted for the locale.
- **`PageHeader` `back` and `PageHeaderBack`:** a back link above the title, router-friendly.
- **`TopBar` compact layout:**
  - below 840px the scope path collapses into one switcher;
  - below 600px the product name hides behind the logo and the panel tools gather in one menu.
- **`SidebarItem` element props and `disabled`.**
- **`Calendar` and `RangeCalendar`:** `disabled` and `readOnly`.
- **`DateRangePicker` `presets`:** quick ranges beside the calendar (today, the last 7, 30 or 90
  days, this month, last month, or your own), cut to `min` and `max`.
- **`Combobox` server search:** `onSearch`, `searchDelay` and `loading` ("Searching…"), with
  `filter={null}` for results the server has already matched. A chosen value keeps its label when
  new results leave it out.
- **`SkipLink` and `TopBar` `messages`.**
- **`Spinner` `tone="neutral"`:** the consistent name for `default`, which stays as a deprecated
  alias.

### Fixed

- **Form:**
  - **ErrorSummary:**
    - it listed only Field rows; it now lists TextField, CheckboxGroup, RadioGroup and Slider
      errors too, and links each to its control;
    - it's an alert with a real heading, and takes focus when it appears.
  - **Field:** an error now replaces the description for screen readers too.
  - **Fieldset:** its description is linked to the group.
  - **Disabled fields:** they dim their description as well as their label.
- **Checkbox:** a `parent` checkbox draws a dash, not a tick, while it's mixed.
- **OTPInput:**
  - its name now reaches every slot, and the Base UI warning is gone;
  - the slots shrink to fit narrow columns.
- **Slider:** range thumbs are named after the label ("Seats, minimum").
- **Choice tiles:** a two-line title no longer runs into its description.
- **Table:**
  - **Refreshing:**
    - while it refreshes, rows stay readable (they faded to 2.7:1), with a busy line under the
      header;
    - refreshes are announced.
  - **Selecting:** in a Card, the header no longer jumps 8px when the first row is ticked.
  - **Count:** the selection count is formatted for the locale.
- **TreeView:** passes the caller's `ref`.
- **Timeline:** the compact dot sits on the title's line, in the event's tone.
- **Stat:** a wrapped StatGroup keeps the gutter, with no stray rules.
- **`formatRelativeTime`:** it rounds before choosing the unit, so it no longer says "60 minutes
  ago" or "12 months ago".
- **Spinner:** a standalone Spinner reads QeetrixProvider's language, and stays server-safe.
- **EmptyState:** renders its `children`.
- **DataState:** it no longer jumps in height between loading and error, and its error is
  announced.
- **Page banner:** a wrapped banner keeps its icon and Dismiss on the first line, and forced colours
  no longer box it.
- **Tooltip:**
  - it describes its trigger (`role="tooltip"`, `aria-describedby`), without repeating a label it
    shows;
  - TooltipProvider's `delay` now applies.
- **Dialog and Drawer:** a scrolling body with nothing focusable can be scrolled from the keyboard.
- **Toast:**
  - a danger toast passes axe and is still announced assertively;
  - a rejected promise shows as danger;
  - `useToast` is stable.
- **CopyButton:** with a visible label it keeps its tooltip and its "Copied" message.
- **Card:** the footer lines up with the body (it was 4px off).
- **Stack, Inline, Grid:** rendered as `ul`/`ol`, they reset list styles and keep list semantics.
- **ScrollArea:** its name and `role="region"` sit on the focusable viewport.
- **Accordion:** panel text uses Qeet Sans on a page that sets no font.
- **QeetrixProvider:** restores the colour scheme on unmount; nested scheme providers no longer
  overwrite each other.
- **AppShell:** without a top bar, the frame leaves no empty band.
- **PageHeader:**
  - its tabs sit on the gutter, with the rule edge to edge;
  - `count` follows the provider's locale.
- **Link:** wraps with its sentence, with the external arrow kept on the last word.
- **Label baselines:** 12px counts sit on the label's baseline in Sidebar, Tab and CommandPalette.
- **CommandPalette:** results share one leading column.
- **Pagination:** the range reads correctly right to left.
- **Breadcrumb and Pagination:** accept an `aria-label` override.
- **Steps:** names have no stray space.
- **Calendar:** its header and days share one width in a stretching layout.
- **RangeCalendar:** keeps disabled days grey inside a range.
- **DatePicker and DateRangePicker:** buttons are named after their field ("Choose date for
  Joining date").
- **Combobox:** Clear is named after its field.
- **CodeBlock:** wrapped lines keep their indent, and the number column fits three-digit lines.
- **Fonts:** Qeet Sans's geometry axis is kept after `font` shorthands (Avatar, Table, Timeline,
  TreeView, OTPInput, EmptyState).
- **Component names:** components keep their names in the build (`Button`, not `Button$1`) in
  DevTools and code snippets. `check:dist` now guards this.

### Changed

- **Table:** rows no longer dim while loading; the busy line shows instead.
- **Close buttons:** in Dialog, Drawer and Toast they use the neutral tone, not Ember.
- **Card footers:** they use `inset-lg` padding (8px taller), except under an edge-to-edge table.
- **Link:** it's inline.
- **ScrollArea:** its name moves to the viewport.
- **Locale defaults:** `Stat`'s `locale` and PageHeader's `count` follow the provider (they were
  always en-IN).
- **Spinner:** without a label, its server markup uses `aria-labelledby` with a hidden label.
- **`formatRelativeTime`:** output changes at unit edges (59 min 40 s is "1 hour ago").
- **Nested QeetrixProvider:** a nested provider with a colour scheme defers to the outermost.
- **Picker names:** DatePicker and DateRangePicker button names include the field's label.

## 0.0.8

Four reusable parts from the gap review, each mocked up and approved first: choice tiles,
AvatarGroup, page banners and QRCode (with our own encoder).

0.0.7 was never published: its release stopped when a QR code test timed out on the CI runner.
Everything meant for it ships here, with QRCode's mask scoring made about twice as fast.

- **`RadioGroup`, `CheckboxGroup` · tiles:** new `variant="tile"`: each option a bordered tile with
  an icon, a title and a line about it, for choices that need explaining (an application's type,
  sign-in methods). A click anywhere on the tile chooses it; the keys stay the group's own (one Tab
  stop and arrows for radios). The chosen tile takes the selected tint and a 2px Ember edge. New
  `columns` (1 to 4) lays tiles out in up to that many columns of at least 12rem, one where it's
  narrow. `Radio` and `Checkbox` gain `icon`. New type `ChoiceVariant` (minor).
- **`AvatarGroup`:** a few people at a glance (a group's members, an application's users): the
  first `max` avatars side by side a hairline apart, so initials stay whole on any row tint, then
  +N. One image to assistive technology, named in full: "412 people: Priya Sharma, Rahul Verma,
  Ananya Iyer and 409 more", with counts and the list formatted for the locale. Strings in English
  and Hindi.
- **`Alert` · page banner:** new `variant="banner"` for a notice about the whole app (maintenance,
  a trial ending, viewing as someone else): one line across the page, the title running into the
  description, actions and Dismiss at the end; the tone's tint edge to edge with a rule in the tone
  under it, on the page's gutter so the icon lines up with the page title. Every banner is the same
  height at each density. New `icon` prop in place of the tone's icon (an eye for "viewing as").
  `AppShell` gains `banners`, the slot for them: under the top bar, above everything else on the
  page. New type `AlertVariant` (minor).
- **`QRCode`:** text a phone camera reads, for authenticator setup (`otpauth://`) and UPI payments,
  from our own encoder: byte mode (UTF-8), versions 1 to 40, levels `L`, `M` (default), `Q` and `H`,
  Reed–Solomon error correction and the standard's mask scoring. Always dark on white, in the dark
  scheme and in forced colours, with the four-module quiet zone inside a hairline tile. An SVG named
  by the required `label`; server-safe. Checked by a reader written from the standard and, where
  the browser has one, by its BarcodeDetector; every version and level was also read by Apple's
  CoreImage. Too long a value throws a RangeError.

## 0.0.6

Date components built in, with no date library (07-components.md, "Dates without a library"),
one Table for every list, and the parts for detail pages, settings, setup flows and the console's
search: FileUpload, Field help, DescriptionList, CodeBlock, Steps, CommandPalette, FilterTags,
Timeline and TreeView.

**Breaking — one Table.** `Table` is now the single way to show records: give it `columns` and
`rows`, and sorting, selection, row actions and the loading, empty and error states are built in.
`TableCaption`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` and their prop types
are no longer exported; tables made from them become one `<Table label rows rowId rowLabel
columns />`. Name a table with `label` (it was a caption or `aria-label`). No Qeet product used the
parts yet.

- **`Table`:** sortable headers (buttons, `aria-sort`; one way, the other, then the server's order;
  `sortFirst: "descending"` for dates and amounts); `selectable` rows with a page-wide header
  checkbox (mixed when some are chosen) that keeps rows chosen on other pages; a bar with the
  count, `bulkActions` and Clear in place of the `toolbar` while rows are selected; `rowActions` in
  a menu named for the row; placeholder rows while loading, dimmed rows while refreshing, and
  `empty` and `error` messages under the header; a sticky header. Built for server-paged lists:
  the rows arrive sorted and paged. New types `TableColumn`, `TableSort`, `SortDirection`. Strings
  in English and Hindi.

- **`Calendar`:** a month of dates to choose from, following the WAI-ARIA date picker grid. One day
  in the Tab order; arrow keys move by day and week (mirrored right-to-left), Home and End to the
  week's ends, Page Up and Page Down by month (with Shift, by year), Enter or Space choose. Each day
  is read as its full date, today as "Today, …". `min`, `max` and `isDateDisabled`; the week starts
  by locale (Sunday for India). Today has a thin Ember outline, the chosen day the Ember fill. Dates
  are "YYYY-MM-DD" strings; the arithmetic runs on UTC midnights with the browser's `Intl`, always
  Gregorian. The title ("October 2026 ⌄") opens the years, a decade a page, then that year's
  months, then their days; Escape steps back to the days. Every view keeps the same size. Strings
  in English and Hindi.
- **`DatePicker`:** a field to type a date in the locale's order (25/10/2026 for India) or choose
  it from the Calendar in a popover exactly as wide as the field. Typed text is read on leaving the
  field or on Enter, with any separator; text that isn't an allowed date stays, and the field turns
  invalid with the reason through Field. Alt+Down opens the calendar; focus returns to where it was
  opened from. With `name`, a hidden input submits "YYYY-MM-DD".
- **`RangeCalendar`:** a Calendar that chooses a range: the first pick is one end, the range
  follows the pointer or focus until the second, and ends picked backwards are swapped. Escape
  undoes a half-chosen range. A band of the subtle brand fill with Ember ends; every day in it is
  selected, and each step is announced. Exports the `DateRange` type.
- **`DateRangePicker`:** one field for a range ("01/12/2026 – 31/12/2026"), typed with any
  separators in either order, or chosen in a RangeCalendar in a popover as wide as the field.
  Errors as DatePicker's; `startName` and `endName` submit "YYYY-MM-DD".
- **`Avatar`, `TopBarSwitcher`:** initials are centred on the capitals' own height (CSS `text-box`
  trimming), not on the room the font keeps for descenders: they sat up to 0.6px high. A test checks
  the rendered pixels at every size in Chromium, Firefox and WebKit.
- **`Table`:** cells keep `space.gap-xs` above and below, so two-line content such as an AvatarItem
  doesn't touch the row lines (one-line rows stay at the density's row height); the row checkbox is
  centred on the row, not on the text baseline.
- **`AvatarItem`:** a person as lists and menus show them: avatar, name and an optional second
  line (an email, a role). The two lines sit close, together as tall as a `md` avatar (32px), so
  they fit a compact table row; long text ends with an ellipsis. Server-safe.
- **`SearchField`:** a search box for lists: the Input box with a search icon, `type="search"`, and
  a Clear button while there's text; Escape clears it first. `onSearch` runs when typing pauses
  (`searchDelay`, 300 ms), at once on Enter, and with "" when cleared. Strings in English and Hindi.
- **`PopoverContent`:** new `anchor` prop, to position against another element than the trigger
  (minor).
- **`CommandPalette`:** search or jump to, over the page: opened from the top bar's search or ⌘K /
  Ctrl+K anywhere, with grouped results (users with avatars, applications, settings with where they
  live, actions with their keys), the typed text bold, arrows to move, Enter to open, Escape to
  close. Filters by label, description and keywords, or the app searches with `onQueryChange`.
- **`FilterTags`:** the filters applied to a list as removable tags ("Status: Active ×"), with
  Clear all and an announced summary ("412 of 1,284 users"); focus moves to the next tag, then to
  `returnFocusTo`.
- **`Timeline`, `TimelineGroup`, `TimelineItem`:** what happened, newest first, grouped by day: an
  icon, the event, where or by whom, and when (`<time>` with `dateTime`); failures in danger; a
  compact dots variant. Server-safe.
- **`TreeView`:** the WAI-ARIA tree view for organisation units, nested groups and permissions:
  arrows, Right and Left to open, close and step in or out (mirrored right-to-left), Home, End and
  type-ahead; select one node, or `checkable` with parents mixed while some nodes are on.
- **`Steps`:** where a person is in a setup: done steps filled Ember with a tick, the current one
  outlined Ember, those to come grey, joined by a line that turns Ember behind them. Horizontal for
  short wizards (only the current label where it's narrow), vertical with descriptions for longer
  ones. An ordered list with `aria-current="step"`; the others are read as Completed or Not started.
  `onStepSelect` makes done steps buttons back to themselves.
- **`CodeBlock`:** code to read and copy: a command, a snippet, JSON or XML, coloured by the code
  tokens with our own small highlighter (shell, JavaScript and TypeScript with JSX, JSON, XML and
  HTML). More than one line gets a header with the language and Copy, and CSS line numbers that
  copying never picks up; long lines scroll in a named, keyboard-reachable region, or `wrap`.
  Ligatures are off, so code shows exactly as typed.
- **`DescriptionList`, `DescriptionItem`:** facts about one record as term and value pairs, in a
  semantic `dl`. `rows` (default): the term beside its value on the value's first line, a line
  between rows, the term above the value under 24rem; in a Card, edge to edge. `columns`: term above
  value in up to `columns` columns of at least 8rem. An empty value shows "—", read as "Not set".
- **`Field`:** new `help` prop: an ⓘ button after the label opens a short explanation in a popover
  titled with the label (a toggletip: click, not hover, so it works by touch and keyboard and can
  hold a link). The button is named "About {label}" and takes no more height than the label, so a
  field with help lines up with its neighbours at every density.
- **`FileUpload`:** choose or drop files, in a Field. A dashed drop zone over a real file input (the
  keyboard and screen readers get the browser's own control), Ember while a file is dragged over
  it. Files that pass `accept`, `maxSize` and `multiple` go to `onSelect` for the app to upload; the
  rest are listed with the reason ("Only XML files can be used here", "Larger than 1 MB"). The app
  reports each upload in `items`: uploading with progress, uploaded, or failed with a reason, each
  with a remove button. The hint ("XML, up to 1 MB") and sizes are written for the locale. Strings
  in English and Hindi.

## 0.0.5

Tier 1 of the design-system gap review (07-components.md, "Gap review"), from
`@qeetrix/react/experimental`.

- **`Combobox`:** pick from many options by typing to filter, on Base UI's Combobox. The same field
  as Input and Select (height, edges, states) and the Select's menu list; flat or grouped options
  with an optional description line; values are IDs, labels are matched. `multiple` shows chosen
  values as removable pills (Backspace removes the last; the arrow keys reach the rest, as the
  input's description says). A clear button appears only when there's a value. Strings in English
  and Hindi.
- **`NumberField`:** a number, typed or stepped, on Base UI's Number Field. The same field as Input,
  with units as affixes ("minutes", ₹) and − and + steppers at the end (they can be turned off).
  Arrow keys step, Shift or Page Up/Down by ten; `min`/`max` stop the steppers. It formats for the
  locale (en-IN groups in lakhs: 1,28,400) and takes `format` for currency or percent. Strings,
  including its spoken role description, in English and Hindi.
- **`Form` and `ErrorSummary`:** forms on Base UI's Form. Fields validate on submit (or on blur or
  change), server errors arrive through `errors` keyed by each Field's `name`, and `onFormSubmit`
  runs only when everything is valid. Fields stand `space.form-gap` apart. A failed submit, or
  server errors, put an ErrorSummary at the top (GOV.UK's pattern): the danger Alert titled "Fix
  these to continue", each problem worded as the field's own error and linking to its control, and
  focus moves to it. `ErrorSummary` is exported on its own too. Strings in English and Hindi.
- **`Pagination`:** pages of a list for offset/limit APIs, with or without a total (the shape ID's
  and Notify's APIs use): the range ("1–25 of 1,284", grouped for the locale) announced politely,
  First, Previous, Next and, with a total, Last; optional compact "Rows per page"; buttons off
  while loading; chevrons mirrored right-to-left. The Qeet ID Users fixture uses it.
- **Form consistency:** the test that every field shares its edges and height now includes
  Combobox and NumberField, and the form's main button carries its trailing arrow (as does the
  two-step sign-in's Verify).

## 0.0.3

The first two Phase 5 increments, from `@qeetrix/react/experimental`: C1, the console frame, and
C2, secure entry. Experimental parts may change in a patch release; each moves to the root export
once it has shipped in its product (07-components.md).

### C1 · Console frame

- **`AppShell`** (design B · Ruled, chosen from three researched concepts; 07-components.md):
  - the frame of every Qeet console: a skip link, the sticky TopBar across the full width, the
    navigation column on the canvas tone, the page, and an end-edge panel; every seam a 1px rule;
  - from 840px the navigation collapses to a 48px rail (`sidebarCollapsed` /
    `defaultSidebarCollapsed` / `onSidebarCollapsedChange`) that expands over the page while hovered
    or focused; below 840px it opens as a drawer from the start edge;
  - `drawers` (help, assistant, activity), opened from the TopBar's tools: one at a time, pushing
    the page from 1200px; `notifications` above the page; `density`, compact by default;
  - `useAppShell()` tells content inside the frame when the sidebar is a rail.
- **`TopBar`, `TopBarSwitcher`, `TopBarSearch`:**
  - black in light and dark (the dark scheme on itself), topped by a 2px Ember line;
  - product to global, left to right: launcher cell, product, the scope path with drawn slashes,
    centred search, panel triggers and utilities, account;
  - `TopBarSwitcher` is a step of the path (organisation mark, environment status dot, always a
    word) and works as a Menu trigger; `TopBarSearch` is a field-shaped button with its shortcut.
- **`PageHeader`, `PageContent`:** breadcrumb, `title.lg` title with count and status, actions, a
  `summary` strip bled to the page edges, and tabs at the foot; a 32px page gutter.
- **`Stat`, `StatGroup`:** key numbers in ruled cells; numeric values formatted for the locale; an
  optional decorative trend line whose last point is the Ember mark. Server-safe.
- **`Sidebar`, `SidebarGroup`, `SidebarItem`:**
  - links only, one level of nesting, every item in the Tab order;
  - square rows edge to edge with round icons; the current page gets `aria-current`, the 3px Ember
    bar, weight 600 and an Ember (optionally filled) icon;
  - groups between hairlines under tracked small capitals (`typography.label.caps`; untracked for
    Indic text, which has no case); an optional `title`, `filter` and `footer`;
  - in the rail, icons stay where they are and labels become tooltips.
- **`Breadcrumb`, `BreadcrumbItem`:** server-safe; mirrored chevrons; long labels truncate and keep a
  title.
- **`EmptyState`:** a 24px icon, a title (a heading when given a `level`), a description and actions,
  in `page` or `section` size and `neutral` or `danger` tone. Server-safe.
- **`DataState`:** loading, then error, then empty, then the content. The error state never shows the
  raw error, and `onRetry` adds "Try again".
- **Colour scheme:**
  - `QeetrixProvider` takes `colorScheme`, `defaultColorScheme` and `onColorSchemeChange`, writes
    `data-qx-color-scheme` on `<html>`, and follows the operating system while `system`;
  - `useColorScheme()` returns the scheme and a setter. The product persists the choice.
- **`Button` and `IconButton`:**
  - a `neutral` tone for ghost utility actions in toolbars and headers, whose icons stay neutral
    (design rules §16);
  - a Button's icon sits in its own zone (the new `button-zone` slot), behind a 1px rule as tall as
    the icon, in the label's colour (design rules §7).
- **Strings:** new `appShell`, `sidebar`, `breadcrumb` and `dataState` groups, in English and Hindi.
- **Peer dependency:** `@qeetrix/tokens` `^0.0.7`, for `typography.label.caps`. Since tokens 0.0.6
  the stylesheet also loads Qeet Sans and Fira Code, so the tests now render in the real typefaces.
- **Source check:** every `var(--qx-*)` must name a token in the installed `@qeetrix/tokens` or a
  property the package declares itself, so a token from a newer tokens release can't ship
  unresolved.
- **Platform:**
  - the CSS build, the dist check and the screenshot coverage test understand
    `src/experimental/<family>/`;
  - the test helper treats cancelled animations as settled.

### C2 · Secure entry

- **`CopyButton`:** copies a value (or what a function returns, even asynchronously); the icon
  turns into a check, "Copied" is announced politely, focus stays, and it resets after 2 seconds.
  It fails visibly where there's no clipboard. An IconButton named by `label`, or a Button with a
  visible label.
- **`Alert`:** `info`, `success`, `warning` or `danger` on the status tint with the 3px status edge;
  a title (led by a hidden tone word), a description, actions and an optional Dismiss. `announce`
  makes it `role="status"` or `role="alert"` only when it appears after something happens. It never
  takes focus or disappears by itself.
- **`PasswordInput`:** an Input with a pressed-state Show password toggle, announced; hidden by
  default and hidden again when its form submits; `current-password` / `new-password` / `off`;
  spelling and capitalisation tools off; a Caps Lock warning; `endAdornment` for a CopyButton.
- **`OTPInput`:** one-time codes in slots on Base UI's OTP Field: typing moves on, paste fills
  every slot, SMS autofill lands at once; numeric by default; `groups`, `md` and `lg` sizes; the
  first slot takes the field's label, the rest are "Character 2 of 6".
- **Strings:** new `copyButton`, `alert`, `passwordInput` and `otpInput` groups, in English and
  Hindi.

## 0.0.2

Every primitive, in six increments: the foundation, actions, form controls, overlays, selection and
disclosure, and display and status. Then the Phase 4 close-out: localisation, forced colours,
right-to-left, reduced motion and the sign-in exit screen.

### Foundation

All nine are server-safe and render in React Server Components.

- **Layout:**
  - `Box`: a token-only surface (padding, background, border, corners);
  - `Stack` and `Inline`: vertical and horizontal flows with token gaps;
  - `Grid`: responsive equal columns on the window size classes.
- **Type:**
  - `Text`: body roles, weights, tones, monospace, truncation;
  - `Heading`: the level sets the element, the size sets the look; Geo letterforms for display.
- **`Separator`:** 1px, horizontal or vertical, optionally decorative.
- **Accessibility:**
  - `VisuallyHidden`: screen-reader-only content;
  - `SkipLink`: the first focusable element on a page, hidden until focused.
- **Shared types:** `Space`, `Inset`, `TextAlign`, `RenderProp`.
- **Imports:** every component also has its own entry point (`@qeetrix/react/stack`) and stylesheet
  (`@qeetrix/react/css/stack.css`).

### Actions

- **`Button`** (on Base UI Button):
  - the label comes first, with an optional sharp trailing icon;
  - variants `solid` (Ember primary), `soft` (warm-graphite secondary) and `ghost`; tones `brand` and
    `danger`; sizes that follow the density;
  - `loading` sets `aria-busy` and shows a spinner in the icon's place;
  - a disabled button stays focusable, so its reason can be read.
- **`IconButton`:** square and icon-only; its `aria-label` is required by its type.
- **`Link`:** default, subtle and inherit tones. `external` opens a new tab with
  `rel="noopener noreferrer"`, an arrow mark and a screen-reader note.
- **`Toggle` and `ToggleGroup`** (on Base UI):
  - pressed state with `onPressedChange`, and `filledWhenPressed` swaps to the icon's filled drawing;
  - groups are segmented or separate, single-choice or `multiple`, with arrow-key focus.
- **`Spinner`:** four sizes. It is announced as a status unless `decorative`, and fades instead of
  spinning under reduced motion.
- **Shared types:** `ControlSize`, `QeetrixIcon`.
- **Dependencies:**
  - new peer `@base-ui/react` ^1.9.0;
  - new dependency `@qeetrix/icons` ^1.0.12, for the external-link mark.

### Form controls

All are client components on Base UI's Field, Fieldset, Input, Checkbox, Radio Group and Switch, so
labels, descriptions and errors link to their controls without ids. On every form control, `ref` and
extra props go to the control, while `className` and `style` place the row.

- **`Field`:**
  - a label, help text and error around any control;
  - `optional` adds "(optional)", and Qeetrix never marks required fields;
  - `error` shows a message now (from the server, say) and marks the field invalid. Without it, the
    browser's or `validate`'s message shows with a sharp alert icon;
  - the error replaces the help text;
  - `hideLabel` is for toolbar searches only.
- **`Input`:** the filled box with a bottom line, a leading `icon`, and start and end adornments.
  It takes its focus, invalid, read-only and disabled looks from the input.
- **`Textarea`:** the same look. It grows with its content between `rows` and `maxRows` through CSS
  `field-sizing`, with no script.
- **`TextField`:** Field and Input in one, the default form row.
- **`Fieldset`:** a section of fields under a `title.sm` legend, spaced by the density's form gap.
  `disabled` disables everything inside.
- **`Checkbox` and `CheckboxGroup`:**
  - the 16px box with a sharp tick, and the mixed state with a dash;
  - a `parent` checkbox selects the whole group;
  - the label row is at least 24px tall.
- **`Radio` and `RadioGroup`:** the 5px Ember ring. Arrow keys move and select, and RadioGroup is
  generic over its value type.
- **`Switch`:** a 32×18 track with a square thumb that moves to the end side, in either text
  direction.
- With no visible label, Checkbox, Radio and Switch require `aria-label` or `aria-labelledby` by
  their type.
- **Shared types:** `FieldMessageProps`, `ChoiceLabelProps`, `ChoiceOrientation`.

### Overlays

All are client components on Base UI. Each has a root, a trigger that renders your control, and a
content part that assembles the portal, positioner and popup.

- **`Popover`:** an anchored panel with an optional title and description. Focus moves in on open
  and returns to the trigger on close.
- **`Tooltip`:** one component around its trigger. It opens after 500ms of hover or at once on
  focus. `TooltipProvider` groups neighbours, so the next one opens at once.
- **`Menu`:**
  - items with sharp icons, shortcuts and a `danger` tone;
  - checkbox and radio items in a 16px mark column;
  - group labels, separators and submenus;
  - the 2px Ember start bar on the highlighted item, which follows the text direction.
- **`Dialog`:**
  - `intent` is `standard`, `danger` or `warning`, the last two as alert dialogs with a red or amber
    intent line;
  - `dismissible`, off by default for `danger`, so only its actions close it;
  - sizes 400, 560 and 800px;
  - the close button comes last in the focus order, so a dialog opens on its first field or its
    least destructive action.
- **`Drawer`:**
  - a full-height side panel at the `end` or `start` edge;
  - ruled header and footer, and a scrolling body;
  - focus goes to the first field, except on touch;
  - it can be swiped away.
- **`ToastProvider` and `useToast`:**
  - `add`, `close`, `update` and `promise`;
  - tones `info`, `success`, `warning` and `danger`, each with a 3px status edge and a sharp icon;
  - one action at most;
  - `danger` toasts stay until dismissed and are announced at once.
- **`IconButton`** now shows its `aria-label` as a tooltip. `tooltip={false}` turns it off, and
  other text replaces it.
- **Stacking:** anchored layers use `z.popover`, so a menu opened in a dialog sits above it.

### Selection and disclosure

- **`Select`:**
  - a field-style trigger with a chevron, and a menu-style list below it;
  - the chosen option carries an Ember check;
  - `items` can be flat or grouped, and `multiple` lists the chosen labels;
  - generic over the value. A Field labels it.
- **`Tabs`, `TabsList`, `Tab`, `TabsPanel`:**
  - the 3px Ember bar slides under the selected tab, and `TabsList` draws it;
  - a selected tab has weight 600 and can fill its icon;
  - padding is 12px at compact density and 16px otherwise;
  - `activateOnFocus` is on by default;
  - vertical tabs carry the line and bar on the start edge.
- **`Slider`:**
  - a 4px track, the Ember range, and a 16px square thumb ringed in the surface colour;
  - `label` and `showValue` with `Intl` formatting;
  - a range renders one thumb per value, named Minimum and Maximum.
- **`Accordion`, `AccordionItem`:**
  - ruled sections with a `title.sm` trigger inside a heading (`headingLevel`), and a turning
    chevron;
  - the panel's height animates;
  - find in page opens a closed section that holds the match.
- **`Collapsible`, `CollapsibleTrigger`, `CollapsiblePanel`:** one unruled section.
- **`ScrollArea`:** 8px scrollbars that show on hover, while scrolling and on keyboard focus. The
  region takes focus when it overflows.

### Display and status

- **`Card`:**
  - a raised surface with a 1px line, 4px corners and no shadow;
  - a ruled header with `title`, the required heading `level`, `description` and `actions`, and an
    optional ruled `footer`;
  - a titled card is a section labelled by its title, and a table in the body runs edge to edge.
  - Server-safe.
- **`Table`, `TableCaption`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`:**
  - a neutral header band and row heights from the density;
  - `numeric` cells use tabular figures, end-aligned;
  - `selected` rows keep their Ember tint under the pointer.
  - Server-safe.
- **`Badge`:** pills in six tones with an optional sharp icon. The `brand` fill is
  `bg.brand.subtle`, so its text meets AA. Server-safe.
- **`Avatar`:** a circle with the photo, or initials while it loads or when it fails. The initials
  use whole graphemes, so Indic names stay intact. It can be `decorative`.
- **`Progress` and `Meter`:** Slider's header, a 4px track and an Ember indicator (Meter takes a
  status tone). Indeterminate progress slides, and fades under reduced motion.
- **`Skeleton`:** `text`, `block` or `circle`. It pulses, holds still under reduced motion, and is
  always hidden from assistive technology. Server-safe.

### Phase 4 close-out

- **`QeetrixProvider`:**
  - `locale` (default `en-IN`) for formatting;
  - `direction`, which wraps Base UI's DirectionProvider;
  - `messages`, merged over the English defaults group by group.
  - Nested providers inherit what they don't set. `useLocale()` reads the locale.
- **Strings:**
  - every library string comes from one typed catalogue (`QeetrixMessages`);
  - Field, TextField, DialogContent, DrawerContent, ToastProvider, Slider and Link take a `messages`
    prop that wins over the provider;
  - Link stays server-safe, so it takes its string per instance.
- **Locale packs:** Hindi (`@qeetrix/react/locales/hi`) is the first. It's a separate entry point,
  typed as the complete catalogue, and uses Qeet ID's own Hindi words.
- **Formatting:** `formatNumber`, `formatCurrency` (lakh and crore grouping by default) and
  `formatRelativeTime`. They're pure, server-safe and cache their formatters. Slider, Progress and
  Meter format in the provider's locale.
- **Forced colours (Windows High Contrast):**
  - surfaces that showed only a fill or a shadow get a system-colour edge;
  - on states use `Highlight`: pressed Toggle, Switch, checked Checkbox, the Slider and Progress
    fills, the Tabs bar, and highlighted Menu and Select items;
  - separators and the tab list's base line stay visible.
- **Right-to-left:** tests cover arrow keys in Tabs, ToggleGroup, RadioGroup, Slider and the Menu
  submenu, plus the Drawer edge, the Menu bar side and the Input adornment order.
- **Reduced motion:** a test checks that durations collapse and that Spinner and indeterminate
  Progress fade instead.
- **Slider:** a slider named by `aria-label` (no visible label) now passes the name on to its
  thumbs, which are what carry the slider role. A range adds Minimum and Maximum.
- **Sign-in exit screen:** built from primitives alone. Its keyboard order, axe, and its light,
  dark, right-to-left and forced-colours screenshots are all tested.

### Platform

- **Source check:**
  - it bans physical CSS properties and system colours outside forced-colours blocks;
  - it ignores comments when looking for client-only code.

- Each family's stylesheet (`css/<family>.css`) now imports the base layer and the stylesheets of
  the families it renders, so it works on its own.
- Screenshots wait for transitions to finish, and overlays are captured across the whole viewport.
  The accessibility check also waits, since contrast measured mid-fade isn't real. It skips Base
  UI's aria-hidden focus guards, which hand focus on the moment it lands.
- A type-only import between families no longer pulls in the other family's stylesheet.
- Screenshots freeze endless animations (spinner, skeleton, indeterminate progress), so they match
  every run.
- The nightly Firefox and WebKit run tests without V8 coverage, which works only in Chromium.
  Every browser test passes in all three engines.

## 0.0.1

The engineering platform, with no components yet:
- an unbundled ESM build with type declarations;
- a precompiled stylesheet in the `qx.base` and `qx.components` cascade layers;
- quality gates, and a release path with npm trusted publishing and provenance.
