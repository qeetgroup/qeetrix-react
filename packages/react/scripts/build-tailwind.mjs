#!/usr/bin/env node
// Writes dist/tailwind.css, the @qeetrix/react/tailwind.css export: Tailwind CSS v4 utilities named
// after the Qeetrix tokens, so every product writes the same classes instead of
// `bg-(--qx-color-surface-raised)` or names of its own.
//
// It reads the installed @qeetrix/tokens stylesheet and maps, in an `@theme inline` block (Tailwind's
// form for theme variables that reference other variables):
//   --qx-color-<role>        → --color-<role>        bg-surface-raised, text-text-subtle, border-border-default…
//   --qx-font-family-<name>  → --font-<name>         font-sans (Qeet Sans), font-mono (Fira Code)…
//   --qx-radius-<name>       → --radius-<name>       rounded-control, rounded-surface…
//   --qx-shadow-<name>       → --shadow-<name>       shadow-raised, shadow-overlay…
//   --qx-space-<group>-<size>→ --spacing-<group>-<size>  p-inset-md, gap-gap-sm, my-layout-lg…
// and each typography role to one `@utility typography-<role>-<size>` that applies the whole role:
// the font shorthand, its letter spacing and Qeet Sans's GEOM axis.
//
// Every value is the token's own variable, so the utilities follow data-qx-color-scheme and density.
// Run by `bun run build`; tests/tailwind.server.test.ts checks every token is mapped.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** The custom properties a stylesheet defines, in first-seen order. */
export function tokenNames(css) {
  return [...new Set([...css.matchAll(/^\s*(--qx-[a-z0-9-]+)\s*:/gm)].map((m) => m[1]))];
}

/** A role's own parts, not roles: `--qx-typography-body-md-font-size` and the like. */
const ROLE_PARTS = /-(font-family|font-size|font-weight|line-height|letter-spacing|font-geometry)$/;

/** The mapping for the tokens a stylesheet defines, as Tailwind v4 CSS. */
export function tailwindStylesheet(tokensCss, tokensVersion = "") {
  const names = tokenNames(tokensCss);
  const theme = [];
  const group = (comment, prefix, to) => {
    const found = names.filter((name) => name.startsWith(prefix));
    if (found.length === 0) return;
    theme.push(`  /* ${comment} */`);
    for (const name of found) theme.push(`  --${to}${name.slice(prefix.length)}: var(${name});`);
  };
  group(
    "Colour roles: bg-*, text-*, border-*, fill-*, ring-* and every colour utility.",
    "--qx-color-",
    "color-",
  );
  group(
    "Font families: font-sans is Qeet Sans, font-mono Fira Code.",
    "--qx-font-family-",
    "font-",
  );
  group("Corners: rounded-*.", "--qx-radius-", "radius-");
  group("Elevation: shadow-*.", "--qx-shadow-", "shadow-");
  group(
    "Space: p-*, m-*, gap-*, inset-* and the other spacing utilities.",
    "--qx-space-",
    "spacing-",
  );

  const roles = names.filter(
    (name) => name.startsWith("--qx-typography-") && !ROLE_PARTS.test(name),
  );
  const utilities = roles.map((role) => {
    const name = role.slice("--qx-".length);
    return [
      `@utility ${name} {`,
      `  font: var(${role});`,
      `  letter-spacing: var(${role}-letter-spacing);`,
      `  font-variation-settings: "GEOM" var(${role}-font-geometry);`,
      "}",
    ].join("\n");
  });

  return [
    "/* @qeetrix/react/tailwind.css: Tailwind CSS v4 utilities named after the Qeetrix tokens.",
    `   Generated from @qeetrix/tokens${tokensVersion ? ` ${tokensVersion}` : ""} by scripts/build-tailwind.mjs: don't edit.`,
    "",
    "   After Tailwind, with the layer order the README gives:",
    "     @layer theme, base, components, utilities;",
    '     @import "@qeetrix/tokens/tokens.css";',
    '     @import "@qeetrix/react/styles.css" layer(components);',
    '     @import "tailwindcss";',
    '     @import "@qeetrix/react/tailwind.css";',
    "",
    "   Every utility reads the token's variable, so it follows data-qx-color-scheme and density. */",
    "",
    "@theme inline {",
    ...theme,
    "}",
    "",
    "/* Typography roles: one utility applies the whole role, its font, letter spacing and GEOM axis. */",
    ...utilities.flatMap((utility) => [utility, ""]),
  ].join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const require = createRequire(join(root, "package.json"));
  const tokensCss = readFileSync(require.resolve("@qeetrix/tokens/tokens.css"), "utf8");
  const { version } = JSON.parse(
    readFileSync(
      join(dirname(require.resolve("@qeetrix/tokens/tokens.css")), "..", "package.json"),
      "utf8",
    ),
  );
  mkdirSync(join(root, "dist"), { recursive: true });
  writeFileSync(join(root, "dist", "tailwind.css"), tailwindStylesheet(tokensCss, version));
}
