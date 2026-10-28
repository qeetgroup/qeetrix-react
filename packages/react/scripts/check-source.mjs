/**
 * check-source.mjs — rules on the authored source that review alone used to miss
 * (05-design-rules.md, decisions D-02, D-06, D-09). Fails with every violation listed.
 *
 *   node scripts/check-source.mjs [root]      root defaults to this package; the gate self-test
 *                                             points it at deliberately broken fixtures.
 *
 * TypeScript modules
 *   - a module that uses Base UI, client hooks or context starts with "use client", and the
 *     directive appears nowhere but the first statement;
 *   - no dangerouslySetInnerHTML, Math.random or localStorage (src/internal/storage.ts, the one
 *     guarded module that remembers a product's keyed choices, excepted).
 * CSS (src/<family>/<family>.css)
 *   - colours, corners, shadows, type, motion and stacking come from var(--qx-*) tokens;
 *   - every var(--qx-*) names a token in the installed @qeetrix/tokens, or a property declared
 *     in the package's own CSS (so a token from a newer tokens release can't ship unresolved);
 *   - no raw colour literals, no !important;
 *   - CSS system colours only inside @media (forced-colors: active), where they're the palette;
 *   - logical properties only (right-to-left, D-13): no margin-left, left, text-align: right…;
 *   - every class selector starts with qx-.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = process.argv[2] ?? fileURLToPath(new URL("..", import.meta.url));
const src = join(root, "src");

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const files = walk(src);
const isTest = (f) => /\.test\.tsx?$/.test(f);
const problems = [];
const report = (file, message) => problems.push(`${relative(root, file)}: ${message}`);

// ---- TypeScript ---------------------------------------------------------------------------
const CLIENT_SIGNS = [
  [/from\s+["']@base-ui\/react/, "imports Base UI"],
  [/\buse(?!Id\b)[A-Z]\w*\s*\(/, "calls a client hook"],
  [/\bcreateContext\s*\(/, "creates a context"],
];
const FORBIDDEN = [
  [/dangerouslySetInnerHTML/, "uses dangerouslySetInnerHTML"],
  [/\bMath\.random\s*\(/, "uses Math.random (not stable across server and client)"],
  [/\blocalStorage\b/, "uses localStorage directly"],
];

// src/internal/storage.ts is the one module that reads and writes localStorage, guarded there.
const STORAGE_MODULE = /src\/internal\/storage\.ts$/;

for (const file of files.filter((f) => /\.tsx?$/.test(f) && !isTest(f))) {
  const code = readFileSync(file, "utf8");
  const firstStatement = code.replace(/^\s*(\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)\s*/g, "").trimStart();
  const hasDirectiveFirst = /^["']use client["'];?/.test(firstStatement);
  const directiveCount = (code.match(/^\s*["']use client["'];?\s*$/gm) ?? []).length;
  if (directiveCount > 0 && !hasDirectiveFirst)
    report(file, '"use client" must be the first statement');
  // Signs are looked for in code, not comments: a doc comment may name a hook.
  const bare = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
  if (!hasDirectiveFirst) {
    for (const [pattern, why] of CLIENT_SIGNS) {
      if (pattern.test(bare)) report(file, `${why} but does not start with "use client"`);
    }
  }
  for (const [pattern, why] of FORBIDDEN) {
    if (pattern.test(bare) && !(why.includes("localStorage") && STORAGE_MODULE.test(file))) {
      report(file, why);
    }
  }
}

// ---- CSS -----------------------------------------------------------------------------------
const TOKEN_ONLY = [
  /^(color|background|background-color|border-color|border-(top|right|bottom|left|block|inline)(-start|-end)?-color|outline-color|fill|stroke|caret-color|accent-color|text-decoration-color|column-rule-color)$/,
  /^border(-(top|right|bottom|left|start|end))?-(start-start|start-end|end-start|end-end|top-left|top-right|bottom-left|bottom-right)?-?radius$/,
  /^(box-shadow|text-shadow)$/,
  /^(z-index)$/,
  /^(font-family|font-size|font-weight|line-height|letter-spacing|font)$/,
  /^(transition-duration|animation-duration|transition-timing-function|animation-timing-function)$/,
];
const KEYWORDS =
  /^(inherit|initial|unset|revert|revert-layer|currentcolor|transparent|none|0|auto|normal)$/i;
const RAW_COLOUR = /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;
// CSS system colours: the palette forced colours (Windows High Contrast) paints with.
const SYSTEM_COLOUR =
  /\b(Canvas|CanvasText|LinkText|VisitedText|ActiveText|ButtonFace|ButtonText|ButtonBorder|Field|FieldText|Highlight|HighlightText|SelectedItem|SelectedItemText|Mark|MarkText|GrayText|AccentColor|AccentColorText)\b/gi;
// Right-to-left (D-13): logical properties only.
const PHYSICAL =
  /^((margin|padding|border)-(left|right)(-[a-z]+)?|left|right|border-(top|bottom)-(left|right)-radius|float|clear)$/;
const FORCED = /@media\s*\(\s*forced-colors\s*:\s*active\s*\)\s*\{/g;

/** Split a stylesheet into its forced-colours blocks and everything else. */
function splitForced(css) {
  const inside = [];
  let outside = "";
  let from = 0;
  for (const match of css.matchAll(FORCED)) {
    if (match.index < from) continue;
    let depth = 1;
    let i = match.index + match[0].length;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      i++;
    }
    outside += css.slice(from, match.index);
    inside.push(css.slice(match.index + match[0].length, i - 1));
    from = i;
  }
  return { outside: outside + css.slice(from), inside: inside.join("\n") };
}

function checkDeclarations(file, css, forced) {
  for (const match of css.matchAll(/(?:^|[;{\s])([a-z-]+)\s*:\s*([^;{}]+)(?=;|})/g)) {
    const [, property, raw] = match;
    const value = raw.trim();
    if (property.startsWith("--")) continue;
    if (PHYSICAL.test(property)) {
      report(
        file,
        `${property} — a physical property; use its logical form (inset-inline, margin-inline…)`,
      );
    }
    if (property === "text-align" && /^(left|right)$/.test(value)) {
      report(file, `text-align: ${value} — use start or end`);
    }
    // Token names can contain a system colour's word (surface-canvas), so look past them.
    const hasSystemColour =
      value.replace(/var\(--qx-[a-z0-9-]+\)/g, "").match(SYSTEM_COLOUR) !== null;
    if (hasSystemColour && !forced) {
      report(
        file,
        `${property}: ${value} — system colours belong inside @media (forced-colors: active)`,
      );
      continue;
    }
    if (RAW_COLOUR.test(value))
      report(file, `${property}: ${value} — raw colour; use a --qx-* token`);
    else if (TOKEN_ONLY.some((p) => p.test(property))) {
      // In a shadow, `inset` and zero offsets are structure, not design values. In forced colours,
      // system colours are the design values.
      const structural = (
        /shadow$/.test(property) ? value.replace(/\binset\b|(^|\s)0(?=\s)/g, " ") : value
      ).replace(forced ? SYSTEM_COLOUR : /$^/, "");
      const withoutTokens = structural
        .replace(/var\(--qx-[a-z0-9-]+\)/g, "")
        .replace(/calc\(|\)|[\s,*+/-]/g, "");
      // Bare numbers are allowed only as multipliers inside calc(), e.g. calc(-1 * var(--qx-…)).
      const calcMultiplier = /calc\(/.test(value) && /^[\d.]+$/.test(withoutTokens);
      if (withoutTokens !== "" && !KEYWORDS.test(value) && !calcMultiplier) {
        report(file, `${property}: ${value} — must come from --qx-* tokens`);
      }
    }
  }
}

// The custom properties a var() may name: the installed tokens, and those the package declares.
const tokensCss = createRequire(import.meta.url).resolve("@qeetrix/tokens/tokens.css");
const tokensVersion = JSON.parse(
  readFileSync(join(tokensCss, "..", "..", "package.json"), "utf8"),
).version;
const stylesheets = files
  .filter((f) => f.endsWith(".css"))
  .map((file) => [file, readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")]);
const known = new Set(
  [readFileSync(tokensCss, "utf8"), ...stylesheets.map(([, css]) => css)].flatMap((css) =>
    [...css.matchAll(/(--qx-[a-z0-9-]+)\s*:/g)].map((m) => m[1]),
  ),
);
// Components also set properties inline: `{ "--qx-text-lines": n }`, or `--qx-grid-${size}`.
const modules = files
  .filter((f) => /\.tsx?$/.test(f) && !isTest(f))
  .map((f) => readFileSync(f, "utf8"));
for (const code of modules)
  for (const [, name] of code.matchAll(/["'](--qx-[a-z0-9-]+)["']/g)) known.add(name);
const prefixes = modules.flatMap((code) =>
  [...code.matchAll(/`(--qx-[a-z0-9-]*)\$\{/g)].map((m) => m[1]),
);
const isKnown = (name) => known.has(name) || prefixes.some((prefix) => name.startsWith(prefix));

for (const [file, css] of stylesheets) {
  for (const [, name] of css.matchAll(/var\((--qx-[a-z0-9-]+)/g)) {
    if (!isKnown(name))
      report(file, `var(${name}) — not in @qeetrix/tokens ${tokensVersion}, nor declared here`);
  }
  if (/!important/.test(css)) report(file, "uses !important");
  const { outside, inside } = splitForced(css);
  checkDeclarations(file, outside, false);
  checkDeclarations(file, inside, true);
  for (const match of css.matchAll(/\.(-?[a-zA-Z_][\w-]*)/g)) {
    if (!match[1].startsWith("qx-")) report(file, `class .${match[1]} must start with qx-`);
  }
}

if (problems.length > 0) {
  console.error(`✖ source check: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`✔ source check — ${files.length} file(s), no problems`);
