/**
 * build-css.mjs — precompile the Qeetrix stylesheets (decision D-02).
 *
 * Each family's CSS is authored next to its component, in src/<family>/<family>.css: plain CSS with
 * nesting, Base UI's state attributes and var(--qx-*) token values only. This writes:
 *
 *   dist/css/base.css        the qx.base layer
 *   dist/css/state.css       the qx.state layer: the hidden attribute hides any Qeetrix part
 *   dist/css/<family>.css    the family's styles, inside the qx.components layer, after @imports of
 *                            base.css and of every family whose components it renders (Button
 *                            renders Spinner), so one family's stylesheet works on its own
 *   dist/styles.css          the layer order, then every family's styles once
 *
 * Apps import dist/styles.css after their own reset, ideally into their components layer:
 *   @import "@qeetrix/react/styles.css" layer(components);
 *
 * Lightning CSS parses and validates every file and lowers syntax for the supported browsers — the
 * same baseline as Tailwind v4 (Safari 16.4, Chrome 111, Firefox 128), which every Qeet app uses.
 * Output is not minified, so it stays readable in devtools and in review.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { posix } from "node:path";
import { transform } from "lightningcss";

const SRC = new URL("../src/", import.meta.url);
const DIST = new URL("../dist/", import.meta.url);

/** Lightning CSS encodes a browser version as major << 16 | minor << 8. */
const version = (major, minor = 0) => (major << 16) | (minor << 8);
const TARGETS = {
  safari: version(16, 4),
  ios_saf: version(16, 4),
  chrome: version(111),
  firefox: version(128),
};

const LAYERS = ["qx.base", "qx.components", "qx.state"];

function compile(filename, source) {
  const { code, warnings } = transform({
    filename,
    code: Buffer.from(source),
    targets: TARGETS,
    minify: false,
    errorRecovery: false,
  });
  if (warnings.length > 0) {
    throw new Error(`${filename}: ${warnings.map((w) => w.message).join("; ")}`);
  }
  return code.toString().trim();
}

const layer = (name, css) => `@layer ${name} {\n${css.replace(/^/gm, "  ")}\n}\n`;

// A family is a directory under src/ with an index.ts. It has styles of its own when it holds
// <family>.css, and it needs the styles of every family its modules import from (`../<family>/`).
const dirsWithIndex = (dir, prefix = "") =>
  readdirSync(new URL(dir, SRC), { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(new URL(`${dir}${d.name}/index.ts`, SRC)))
    .map((d) => `${prefix}${d.name}`);
// A family is src/<family>, or src/experimental/<family> for the experimental channel (named
// "experimental/<family>"). The experimental entry itself has no styles of its own.
const families = [
  ...dirsWithIndex("./").filter((name) => !["styles", "internal", "experimental"].includes(name)),
  ...(existsSync(new URL("experimental/", SRC))
    ? dirsWithIndex("experimental/", "experimental/")
    : []),
].sort();
const base = (name) => name.split("/").pop();
const ownCss = (name) => existsSync(new URL(`${name}/${base(name)}.css`, SRC));
/** The family a source path belongs to: its first folder, or experimental/<folder>. */
const familyOf = (path) => {
  const [first, second] = path.split("/");
  return first === "experimental" ? `experimental/${second}` : first;
};
const imports = (name) => {
  const deps = new Set();
  for (const file of readdirSync(new URL(`${name}/`, SRC))) {
    if (!/\.tsx?$/.test(file) || /\.test\.tsx?$/.test(file)) continue;
    const code = readFileSync(new URL(`${name}/${file}`, SRC), "utf8");
    // A type-only import brings no component, so no styles.
    for (const [, spec] of code.matchAll(/^import (?!type\b)[^;]*?from\s+["'](\.[^"']+)["']/gm)) {
      const dep = familyOf(posix.normalize(posix.join(name, spec)));
      if (dep !== name && families.includes(dep)) deps.add(dep);
    }
  }
  return [...deps].sort();
};
const styled = (name) => ownCss(name) || imports(name).some(styled);

mkdirSync(new URL("css/experimental/", DIST), { recursive: true });

const blocks = [];
const baseCss = layer(
  "qx.base",
  compile("styles/base.css", readFileSync(new URL("styles/base.css", SRC), "utf8")),
);
writeFileSync(new URL("css/base.css", DIST), baseCss);
blocks.push(baseCss);
const stateCss = layer(
  "qx.state",
  compile("styles/state.css", readFileSync(new URL("styles/state.css", SRC), "utf8")),
);
writeFileSync(new URL("css/state.css", DIST), stateCss);

for (const name of families.filter(styled)) {
  const file = `${name}/${base(name)}.css`;
  const css = ownCss(name)
    ? layer("qx.components", compile(file, readFileSync(new URL(file, SRC), "utf8")))
    : "";
  // @import paths are relative to this family's own file in dist/css/.
  const from = posix.dirname(`${name}.css`);
  // The layer order first, so a family's file used alone still puts qx.state after its components.
  const head = [
    `@layer ${LAYERS.join(", ")};`,
    ...["base", "state", ...imports(name).filter(styled)].map((dep) => {
      const rel = posix.relative(from, `${dep}.css`);
      return `@import "${rel.startsWith(".") ? rel : `./${rel}`}";`;
    }),
  ];
  writeFileSync(new URL(`css/${name}.css`, DIST), `${head.join("\n")}\n\n${css}`);
  if (css) blocks.push(css);
}

const header = [
  "/**",
  " * Qeetrix — GENERATED by @qeetrix/react (scripts/build-css.mjs). Do not edit by hand.",
  " * Needs @qeetrix/tokens loaded first. Import into your components layer:",
  ' *   @import "@qeetrix/react/styles.css" layer(components);',
  " */",
].join("\n");

writeFileSync(
  new URL("styles.css", DIST),
  `${header}\n@layer ${LAYERS.join(", ")};\n\n${[...blocks, stateCss].join("\n")}`,
);
const count = families.filter(ownCss).length;
console.log(
  `✔ CSS built — base + ${count} famil${count === 1 ? "y" : "ies"} → dist/styles.css, dist/css/`,
);
