# @qeetrix/react

The React components of **Qeetrix**, the Qeet Group design system: accessible, token-driven
primitives built on [Base UI](https://base-ui.com), styled by the Qeetrix design language.

> **Status: 0.0.x, increment 1.** The foundation primitives are here: Box, Stack, Inline, Grid, Text,
> Heading, Separator, VisuallyHidden and SkipLink. Actions, form controls, overlays, selection and
> display primitives follow in later increments.

## Install

```bash
bun add @qeetrix/react @qeetrix/tokens
```

## Styles

Load the tokens, then the component styles, once at the root of your app:

```css
@import "@qeetrix/tokens";
@import "@qeetrix/react/styles.css" layer(components);
```

The stylesheet is precompiled. Your Tailwind setup doesn't need to scan this package, and it ships no
utility classes. Qeetrix styles sit in the `qx.base` and `qx.components` cascade layers, so your own
layout utilities override them without `!important`.

## Use

```tsx
import { Box, Grid, Heading, SkipLink, Stack, Text } from "@qeetrix/react";

export function Invoices() {
  return (
    <>
      <SkipLink />
      <main id="main">
        <Stack gap="xl">
          <Heading level={1}>Invoices</Heading>
          <Grid columns={{ base: 1, medium: 2, large: 3 }} gap="md">
            <Box padding="lg" background="raised" border="default" radius="surface">
              <Text tone="subtle">Due this month</Text>
            </Box>
          </Grid>
        </Stack>
      </main>
    </>
  );
}
```

- **Server-safe:** every component in this release renders in React Server Components.
- **`render` prop:** renders a different element with the same props, e.g. `render={<section />}`.
- **Per-component entry points:** `@qeetrix/react/stack`, plus its own stylesheet at
  `@qeetrix/react/css/stack.css` if you'd rather not load the full one.

| Component | For |
|---|---|
| `Box` | A token-only surface: padding, background, border, corners |
| `Stack`, `Inline` | Vertical and horizontal flows with token gaps (`none` … `4xl`) |
| `Grid` | Equal columns per window size class (600 / 840 / 1200 / 1600px) |
| `Text` | Body text: size, weight, tone, monospace, truncation |
| `Heading` | `level` sets h1–h6; `size` sets the look (display, heading, title) |
| `Separator` | A 1px line, horizontal or vertical |
| `VisuallyHidden` | Content for screen readers only |
| `SkipLink` | "Skip to main content", hidden until focused |

**Layout:** `className` is for placement only (margin, width, grid placement). Visual changes go
through props, so every Qeet product looks the same.

## License

[MIT](https://github.com/qeetgroup/qeetrix-react/blob/main/LICENSE) © Qeet Group
