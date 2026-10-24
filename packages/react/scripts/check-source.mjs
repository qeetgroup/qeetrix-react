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
 *   - no dangerouslySetInnerHTML, Math.random or localStorage.
 * CSS (src/<family>/<family>.css)
 *   - colours, corners, shadows, type, motion and stacking come from var(--qx-*) tokens;
 *   - no raw colour literals, no !important;
 *   - every class selector starts with qx-.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
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

for (const file of files.filter((f) => /\.tsx?$/.test(f) && !isTest(f))) {
  const code = readFileSync(file, "utf8");
  const firstStatement = code.replace(/^\s*(\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)\s*/g, "").trimStart();
  const hasDirectiveFirst = /^["']use client["'];?/.test(firstStatement);
  const directiveCount = (code.match(/^\s*["']use client["'];?\s*$/gm) ?? []).length;
  if (directiveCount > 0 && !hasDirectiveFirst)
    report(file, '"use client" must be the first statement');
  if (!hasDirectiveFirst) {
    for (const [pattern, why] of CLIENT_SIGNS) {
      if (pattern.test(code)) report(file, `${why} but does not start with "use client"`);
    }
  }
  for (const [pattern, why] of FORBIDDEN) if (pattern.test(code)) report(file, why);
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

for (const file of files.filter((f) => f.endsWith(".css"))) {
  const css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  if (/!important/.test(css)) report(file, "uses !important");
  for (const match of css.matchAll(/(?:^|[;{\s])([a-z-]+)\s*:\s*([^;{}]+)(?=;|})/g)) {
    const [, property, raw] = match;
    const value = raw.trim();
    if (property.startsWith("--")) continue;
    if (RAW_COLOUR.test(value))
      report(file, `${property}: ${value} — raw colour; use a --qx-* token`);
    else if (TOKEN_ONLY.some((p) => p.test(property))) {
      const withoutTokens = value
        .replace(/var\(--qx-[a-z0-9-]+\)/g, "")
        .replace(/calc\(|\)|[\s,*+/-]/g, "");
      // Bare numbers are allowed only as multipliers inside calc(), e.g. calc(-1 * var(--qx-…)).
      const calcMultiplier = /calc\(/.test(value) && /^[\d.]+$/.test(withoutTokens);
      if (withoutTokens !== "" && !KEYWORDS.test(value) && !calcMultiplier) {
        report(file, `${property}: ${value} — must come from --qx-* tokens`);
      }
    }
  }
  for (const match of css.matchAll(/\.(-?[a-zA-Z_][\w-]*)/g)) {
    if (!match[1].startsWith("qx-")) report(file, `class .${match[1]} must start with qx-`);
  }
}

if (problems.length > 0) {
  console.error(`✖ source check: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`✔ source check — ${files.length} file(s), no problems`);
