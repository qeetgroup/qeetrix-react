# @qeetrix/react

The React components of **Qeetrix**, the Qeet Group design system: accessible, token-driven
primitives built on [Base UI](https://base-ui.com), styled by the Qeetrix design language.

> **Status: 0.0.x, increments 1–3.** The foundation, action and form-control primitives are here.
> Overlays, selection and display primitives follow in later increments.

## Install

```bash
bun add @qeetrix/react @qeetrix/tokens @base-ui/react @qeetrix/icons
```

`@base-ui/react` powers the interactive components. Icons come from `@qeetrix/icons`: a component's
`icon` prop takes any of its icons, e.g. `icon={PlusIcon}`.

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
import { PlusIcon } from "@qeetrix/icons/icons/plus";
import { Box, Button, Grid, Heading, Inline, SkipLink, Stack, Text } from "@qeetrix/react";

export function Invoices() {
  return (
    <>
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
    </>
  );
}
```

- **Server-safe:** layout, type, `Link` and `Spinner` render in React Server Components. The actions
  built on Base UI and every form control are client components; their `"use client"` directive
  ships in the build.
- **`render` prop:** renders a different element with the same props, e.g. `render={<section />}`.
- **Per-component entry points:** `@qeetrix/react/stack`, plus its own stylesheet at
  `@qeetrix/react/css/stack.css` if you'd rather not load the full one. A family's stylesheet brings
  the base styles and those of the components it renders (`css/text-field.css` brings Field and
  Input).

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
| `Button` | Label first, an optional trailing icon; solid (primary), soft (secondary), ghost; brand or danger; `loading` |
| `IconButton` | A square, icon-only button; `aria-label` is required by its type |
| `Link` | Inline navigation; `external` opens a new tab safely and says so to screen readers |
| `Toggle`, `ToggleGroup` | Pressed or not; segmented or separate groups, single or `multiple` |
| `Spinner` | An indeterminate wait, announced as a status unless `decorative` |
| `TextField` | Label, input, help text and error in one: the default form row |
| `Field` | The label, help text and error around any control; `optional` adds "(optional)" |
| `Input`, `Textarea` | The filled text box with a bottom line; Textarea grows with its content |
| `Fieldset` | A section of fields under a heading, spaced by the density's form gap |
| `Checkbox`, `CheckboxGroup` | On/off or several of a set; mixed state; a `parent` checkbox selects all |
| `Radio`, `RadioGroup` | One of a set; arrow keys move and select |
| `Switch` | A setting that applies at once |

**Layout:** `className` is for placement only (margin, width, grid placement). Visual changes go
through props, so every Qeet product looks the same. On a form control, `className` and `style` place
the whole row, while `ref` and every other prop go to the control itself.

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

## License

[MIT](https://github.com/qeetgroup/qeetrix-react/blob/main/LICENSE) © Qeet Group
