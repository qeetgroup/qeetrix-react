# @qeetrix/react

The React components of **Qeetrix**, the Qeet Group design system: accessible, token-driven
primitives built on [Base UI](https://base-ui.com), styled by the Qeetrix design language.

> **Status: 0.0.x, platform only.** This release sets up the build, the stylesheet and the quality
> gates. The first primitives (layout, text, separator and accessibility utilities) arrive in the
> next increment.

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

## License

[MIT](https://github.com/qeetgroup/qeetrix-react/blob/main/LICENSE) © Qeet Group
