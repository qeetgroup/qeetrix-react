import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
// @ts-expect-error: a plain script, without declarations
import { tailwindStylesheet, tokenNames } from "../scripts/build-tailwind.mjs";

const require = createRequire(import.meta.url);
const tokensCss = readFileSync(require.resolve("@qeetrix/tokens/tokens.css"), "utf8");
const names: string[] = tokenNames(tokensCss);
const sheet: string = tailwindStylesheet(tokensCss, "0.0.0");
const theme = sheet.slice(sheet.indexOf("@theme inline {"), sheet.indexOf("\n}\n"));

describe("@qeetrix/react/tailwind.css", () => {
  it("maps every colour role, font family, radius, shadow and space token in @theme inline", () => {
    const mapped = [
      ["--qx-color-", "--color-"],
      ["--qx-font-family-", "--font-"],
      ["--qx-radius-", "--radius-"],
      ["--qx-shadow-", "--shadow-"],
      ["--qx-space-", "--spacing-"],
    ] as const;
    for (const [from, to] of mapped) {
      const tokens = names.filter((name) => name.startsWith(from));
      expect(tokens.length, from).toBeGreaterThan(0);
      for (const token of tokens) {
        expect(theme, token).toContain(`  ${to}${token.slice(from.length)}: var(${token});`);
      }
    }
    // The surfaces, roles and states the issue names.
    for (const role of [
      "surface-raised",
      "bg-brand-bold-hover",
      "text-subtle",
      "border-default",
      "icon-subtle",
      "overlay-scrim",
    ]) {
      if (names.includes(`--qx-color-${role}`)) expect(theme).toContain(`--color-${role}:`);
    }
    expect(theme).toContain("--font-sans: var(--qx-font-family-sans);");
  });

  it("applies each typography role whole: its font, letter spacing and GEOM axis", () => {
    const roles = names.filter(
      (name) =>
        name.startsWith("--qx-typography-") &&
        !/-(font-family|font-size|font-weight|line-height|letter-spacing|font-geometry)$/.test(
          name,
        ),
    );
    // display, heading, title, body and label at lg, md and sm, code at md and sm, and label-caps.
    expect(roles).toHaveLength(18);
    expect(roles).toContain("--qx-typography-label-caps");
    for (const role of roles) {
      expect(sheet).toContain(
        [
          `@utility ${role.slice("--qx-".length)} {`,
          `  font: var(${role});`,
          `  letter-spacing: var(${role}-letter-spacing);`,
          `  font-variation-settings: "GEOM" var(${role}-font-geometry);`,
          "}",
        ].join("\n"),
      );
    }
  });

  it("holds nothing but the tokens' own variables, so it follows the colour scheme and density", () => {
    const values = [...theme.matchAll(/: (.+);$/gm)].map((m) => m[1]);
    expect(values.length).toBeGreaterThan(100);
    for (const value of values) expect(value).toMatch(/^var\(--qx-[a-z0-9-]+\)$/);
    expect(sheet).not.toMatch(/#[0-9a-f]{3,8}\b|oklch\(|\brgb\(/i);
  });

  it("is a published CSS entry, built with the package", () => {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    expect(pkg.exports["./tailwind.css"]).toBe("./dist/tailwind.css");
    expect(pkg.scripts.build).toContain("scripts/build-tailwind.mjs");
  });
});
