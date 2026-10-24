# @qeetrix/react

## 0.0.2

The foundation primitives (increment 1) and the actions (increment 2).

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

## 0.0.1

The engineering platform, with no components yet:
- an unbundled ESM build with type declarations;
- a precompiled stylesheet in the `qx.base` and `qx.components` cascade layers;
- quality gates, and a release path with npm trusted publishing and provenance.
