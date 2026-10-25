/**
 * Screenshot coverage follows what can change. A family whose CSS uses a density token must capture
 * every density (screenshotEveryMode); one that doesn't captures the two colour schemes
 * (screenshotSchemes), because its density screenshots would be identical. Every family with CSS is
 * screenshotted one way or the other.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const src = new URL("../src/", import.meta.url);
const DENSITY_TOKENS = /--qx-(size-control-(sm|md|lg)|size-row|space-form-gap)\b/;

const familiesIn = (dir: string, prefix = "") =>
  existsSync(new URL(dir, src))
    ? readdirSync(new URL(dir, src), { withFileTypes: true })
        .filter((d) => d.isDirectory() && existsSync(new URL(`${dir}${d.name}/${d.name}.css`, src)))
        .map((d) => `${prefix}${d.name}`)
    : [];
// Every family with styles, the experimental channel's included.
const families = [...familiesIn("./"), ...familiesIn("experimental/", "experimental/")];

describe("screenshot coverage", () => {
  it.each(families)("%s captures the modes it can change in", (family) => {
    const name = family.split("/").pop();
    const css = readFileSync(new URL(`${family}/${name}.css`, src), "utf8");
    const testFile = new URL(`${family}/${name}.test.tsx`, src);
    const test = existsSync(testFile) ? readFileSync(testFile, "utf8") : "";
    const screenshotted = /screenshot(EveryMode|Schemes)\(/.test(test);
    const everyMode = /screenshotEveryMode\(/.test(test);
    // Accessibility-only families (no visible UI of their own) are exempt from screenshots.
    if (["visually-hidden", "skip-link"].includes(family)) return;
    expect(screenshotted, `${family} has no screenshot`).toBe(true);
    expect(everyMode, `${family}: uses a density token → screenshotEveryMode`).toBe(
      DENSITY_TOKENS.test(css),
    );
  });
});
