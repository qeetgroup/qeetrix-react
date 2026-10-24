/**
 * check-api-version.mjs — a public-API change needs the right version (decision D-07).
 *
 *   node scripts/check-api-version.mjs <base-ref>     e.g. origin/main, in a pull request
 *
 * Compares packages/react/etc/react.api.md (the api-extractor report) with the base branch:
 *   - nothing changed, or only additions: any version is fine — version.yml bumps the patch;
 *   - a line removed or changed: the change can break consumers, so the version must be raised to
 *     at least the next minor (0.x.0 while below 1.0, the next major from 1.0 on).
 * The base having no report yet (the first release) passes.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const base = process.argv[2];
if (!base) {
  console.error("usage: node scripts/check-api-version.mjs <base-ref>");
  process.exit(2);
}
const REPORT = "packages/react/etc/react.api.md";
const PACKAGE = "packages/react/package.json";
const show = (path) => {
  try {
    return execFileSync("git", ["show", `${base}:${path}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
};

const before = show(REPORT);
if (before === null) {
  console.log(`✔ API version check — ${base} has no API report yet (first release)`);
  process.exit(0);
}
const lines = (text) =>
  new Set(
    text
      .split("\n")
      .map((l) => l.trimEnd())
      .filter((l) => l.trim() !== ""),
  );
const old = lines(before);
const now = lines(readFileSync(REPORT, "utf8"));
const removed = [...old].filter((l) => !now.has(l));
const added = [...now].filter((l) => !old.has(l));

if (removed.length === 0) {
  console.log(`✔ API version check — ${added.length} line(s) added, none removed`);
  process.exit(0);
}

const parse = (v) => v.split(".").map(Number);
const [baseMajor, baseMinor] = parse(JSON.parse(show(PACKAGE) ?? "{}").version ?? "0.0.0");
const [major, minor] = parse(JSON.parse(readFileSync(PACKAGE, "utf8")).version);
const raised = baseMajor === 0 ? major > 0 || minor > baseMinor : major > baseMajor;

if (raised) {
  console.log(
    `✔ API version check — ${removed.length} line(s) removed or changed, and the version is raised`,
  );
  process.exit(0);
}
const need = baseMajor === 0 ? `0.${baseMinor + 1}.0` : `${baseMajor + 1}.0.0`;
console.error(
  `✖ API version check — the public API lost or changed ${removed.length} line(s):\n  - ${removed.slice(0, 12).join("\n  - ")}` +
    `\nThis can break consumers. Raise ${PACKAGE} to at least ${need}, and write the CHANGELOG section with a migration note.`,
);
process.exit(1);
