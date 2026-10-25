# @qeetrix/react

## 0.0.2

Every primitive, in six increments: the foundation, actions, form controls, overlays, selection and
disclosure, and display and status.

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

### Platform

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
