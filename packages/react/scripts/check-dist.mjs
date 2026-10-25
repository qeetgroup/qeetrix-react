/**
 * check-dist.mjs — rules on the built package (decisions D-02, D-03, D-09, D-14). Run after
 * `bun run build`. Fails with every violation listed.
 *
 *   node scripts/check-dist.mjs [root]      root defaults to this package; the gate self-test
 *                                           points it at deliberately broken fixtures.
 *
 *   - every source module that starts with "use client" still does in dist/ (bundlers have stripped
 *     the directive before, which silently breaks server rendering);
 *   - every path in dist/ is lowercase, so nothing collides on macOS or Windows;
 *   - every component family in src/ has its own export in package.json, every export points at a
 *     built file, and no export uses a wildcard for JavaScript;
 *   - no exported name shadows a browser global (FileList, Notification and Highlight did in
 *     @qeetrix/ui);
 *   - JavaScript and CSS stay within size-budget.json (gzip).
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = process.argv[2] ?? fileURLToPath(new URL("..", import.meta.url));
const src = join(root, "src");
const dist = join(root, "dist");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const budget = JSON.parse(readFileSync(join(root, "size-budget.json"), "utf8"));

const walk = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        return statSync(path).isDirectory() ? walk(path) : [path];
      })
    : [];

const problems = [];
const report = (message) => problems.push(message);
if (!existsSync(dist)) report("dist/ is missing — run `bun run build` first");

// ---- "use client" survives the build ------------------------------------------------------
const startsWithDirective = (code) =>
  /^["']use client["'];?/.test(
    code.replace(/^\s*(\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)\s*/g, "").trimStart(),
  );

for (const file of walk(src).filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))) {
  if (!startsWithDirective(readFileSync(file, "utf8"))) continue;
  const built = join(dist, relative(src, file)).replace(/\.tsx?$/, ".js");
  if (!existsSync(built))
    report(`${relative(root, built)} is missing (built from a client module)`);
  else if (!startsWithDirective(readFileSync(built, "utf8"))) {
    report(`${relative(root, built)} lost its "use client" directive in the build`);
  }
}

// ---- lowercase paths ------------------------------------------------------------------------
const seen = new Map();
for (const file of walk(dist)) {
  const path = relative(dist, file);
  if (path !== path.toLowerCase())
    report(`dist/${path} has uppercase letters; paths must be lowercase`);
  const key = path.toLowerCase();
  if (seen.has(key))
    report(`dist/${path} collides with dist/${seen.get(key)} on a case-insensitive disk`);
  seen.set(key, path);
}

// ---- exports --------------------------------------------------------------------------------
const families = existsSync(src)
  ? readdirSync(src, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !["styles", "internal"].includes(d.name))
      .filter((d) => existsSync(join(src, d.name, "index.ts")))
      .map((d) => d.name)
  : [];
const targets = (entry) =>
  typeof entry === "string" ? [entry] : Object.values(entry).flatMap((v) => targets(v));

for (const name of families) {
  if (!pkg.exports?.[`./${name}`]) report(`src/${name}/ has no "./${name}" export in package.json`);
}
for (const [key, entry] of Object.entries(pkg.exports ?? {})) {
  for (const target of targets(entry)) {
    if (target.includes("*")) {
      // Only the per-family stylesheets may use a wildcard; JavaScript entry points are explicit.
      if (!target.startsWith("./dist/css/")) report(`export "${key}" uses a wildcard (${target})`);
      continue;
    }
    if (!existsSync(join(root, target))) report(`export "${key}" points at missing ${target}`);
  }
}

// ---- names that shadow browser globals -----------------------------------------------------
// Text is allowed on purpose: it is the design-system name every major system uses for its text
// primitive, and the DOM Text constructor is rarely imported in component code.
const BROWSER_GLOBALS = new Set([
  "Animation",
  "Attr",
  "Audio",
  "Blob",
  "Comment",
  "Document",
  "Element",
  "Event",
  "File",
  "FileList",
  "Headers",
  "Highlight",
  "History",
  "Image",
  "Location",
  "Navigator",
  "Node",
  "Notification",
  "Option",
  "Range",
  "Request",
  "Response",
  "Screen",
  "Selection",
  "Storage",
  "Window",
  "Worker",
]);
for (const file of walk(dist).filter((f) => f.endsWith(".d.ts"))) {
  const declarations = readFileSync(file, "utf8");
  for (const m of declarations.matchAll(
    /export\s+(?:declare\s+)?(?:function|const|class|type|interface)\s+(\w+)/g,
  )) {
    if (BROWSER_GLOBALS.has(m[1]))
      report(`${relative(root, file)} exports ${m[1]}, which shadows a browser global`);
  }
  for (const m of declarations.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of m[1].split(",")) {
      const name = part
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.replace(/^type\s+/, "");
      if (name && BROWSER_GLOBALS.has(name))
        report(`${relative(root, file)} exports ${name}, which shadows a browser global`);
    }
  }
}

// ---- size budgets (gzip) ------------------------------------------------------------------
const gz = (file) => gzipSync(readFileSync(file)).length;
const kb = (bytes) => `${(bytes / 1024).toFixed(2)} kB`;
const sizes = [];
const styles = join(dist, "styles.css");
if (existsSync(styles)) sizes.push(["dist/styles.css", gz(styles), budget.stylesheet]);
for (const file of walk(join(dist, "css")))
  sizes.push([`dist/${relative(dist, file)}`, gz(file), budget.familyCss]);
// The experimental entry holds several families; each is held to the family budget on its own.
const budgeted = families.flatMap((name) =>
  name === "experimental" && existsSync(join(dist, name))
    ? readdirSync(join(dist, name), { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => `${name}/${d.name}`)
    : [name],
);
for (const name of budgeted) {
  const dir = join(dist, name);
  const total = walk(dir)
    .filter((f) => f.endsWith(".js"))
    .reduce((sum, f) => sum + gz(f), 0);
  sizes.push([`dist/${name}/ (JavaScript)`, total, budget.familyJs]);
}
for (const [label, size, limit] of sizes) {
  if (size > limit * 1024) report(`${label} is ${kb(size)} gzip, over its ${limit} kB budget`);
}

if (problems.length > 0) {
  console.error(`✖ dist check: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
const largest = sizes.sort((a, b) => b[1] - a[1])[0];
console.log(
  `✔ dist check — ${families.length} famil${families.length === 1 ? "y" : "ies"}, ${walk(dist).length} file(s)` +
    (largest ? `, largest ${largest[0]} at ${kb(largest[1])}` : ""),
);
