# @qeetrix/react

## 0.0.2

The foundation primitives (increment 1), the actions (increment 2) and the form controls
(increment 3).

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

### Platform

- Each family's stylesheet (`css/<family>.css`) now imports the base layer and the stylesheets of
  the families it renders, so it works on its own.

## 0.0.1

The engineering platform, with no components yet:
- an unbundled ESM build with type declarations;
- a precompiled stylesheet in the `qx.base` and `qx.components` cascade layers;
- quality gates, and a release path with npm trusted publishing and provenance.
