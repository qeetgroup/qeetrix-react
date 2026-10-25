/**
 * The gates catch what they claim to catch. Each test builds a deliberately broken example in a
 * temporary directory, runs the real checker against it, and expects it to fail with the right
 * message. This runs on every CI run, so a gate can never quietly stop working (charter, Phase 3).
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";

const pkg = fileURLToPath(new URL("..", import.meta.url));
const repo = join(pkg, "..", "..");
const temps: string[] = [];
afterAll(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

function tree(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "qx-gate-"));
  temps.push(root);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

function run(command: string, args: string[], options: { cwd?: string; input?: string } = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

describe("source check", () => {
  const root = tree({
    "src/leaky/leaky.tsx":
      'import { useState } from "react";\nexport const Leaky = () => useState(0);\n',
    "src/late/late.tsx": 'import "react";\n"use client";\nexport const Late = 1;\n',
    "src/unsafe/unsafe.tsx":
      'export const Unsafe = () => <div dangerouslySetInnerHTML={{ __html: "" }} id={String(Math.random())} data-x={localStorage.length} />;\n',
    "src/paint/paint.css":
      ".qx-paint { color: #ff0000; border-radius: 8px; z-index: 50; transition-duration: 200ms; box-shadow: 0 2px 4px var(--qx-color-border-default); }\n.qx-loud { margin: 0 !important; }\n.button { display: block; }\n.qx-side { margin-left: 4px; text-align: right; background: Highlight; }\n@media (forced-colors: active) { .qx-fine { background: Highlight; color: HighlightText; border: 1px solid CanvasText; } .qx-raw { color: #000; } }\n",
    "src/names/names.css":
      ".qx-names { --qx-names-gutter: var(--qx-space-inset-lg); padding: var(--qx-names-gutter); color: var(--qx-color-text-imaginary); }\n",
  });
  const { status, output } = run("node", [join(pkg, "scripts/check-source.mjs"), root]);

  it("fails", () => expect(status).toBe(1));
  it.each([
    [
      'client hook without "use client"',
      /leaky\.tsx: calls a client hook but does not start with "use client"/,
    ],
    ["directive that isn't first", /late\.tsx: "use client" must be the first statement/],
    ["dangerouslySetInnerHTML", /unsafe\.tsx: uses dangerouslySetInnerHTML/],
    ["Math.random", /unsafe\.tsx: uses Math\.random/],
    ["localStorage", /unsafe\.tsx: uses localStorage/],
    ["raw colour", /color: #ff0000 — raw colour/],
    ["raw radius", /border-radius: 8px — must come from --qx-\* tokens/],
    ["raw z-index", /z-index: 50 — must come from --qx-\* tokens/],
    ["raw duration", /transition-duration: 200ms — must come from --qx-\* tokens/],
    [
      "raw shadow offsets",
      /box-shadow: 0 2px 4px var\(--qx-color-border-default\) — must come from --qx-\* tokens/,
    ],
    ["!important", /paint\.css: uses !important/],
    ["class without the qx- prefix", /class \.button must start with qx-/],
    ["physical property", /margin-left — a physical property/],
    ["physical text alignment", /text-align: right — use start or end/],
    [
      "system colour outside forced colours",
      /background: Highlight — system colours belong inside @media \(forced-colors: active\)/,
    ],
    ["raw colour even in forced colours", /color: #000 — raw colour/],
    [
      "token the installed tokens don't have",
      /var\(--qx-color-text-imaginary\) — not in @qeetrix\/tokens \d+\.\d+\.\d+/,
    ],
  ])("catches a %s", (_, message) => expect(output).toMatch(message));
  it("allows tokens, and properties the package declares itself", () => {
    expect(output).not.toMatch(/var\(--qx-space-inset-lg\) — not in/);
    expect(output).not.toMatch(/var\(--qx-names-gutter\) — not in/);
  });
  it("allows system colours inside forced colours", () => {
    expect(output).not.toMatch(/HighlightText — /);
    expect(output.match(/background: Highlight/g)).toHaveLength(1);
  });
});

describe("dist check", () => {
  const root = tree({
    "package.json": JSON.stringify({
      exports: {
        ".": "./dist/index.js",
        "./ghost": "./dist/ghost/index.js",
        "./all/*": "./dist/*.js",
      },
    }),
    "size-budget.json": JSON.stringify({ stylesheet: 0.001, familyCss: 0.001, familyJs: 0.001 }),
    "src/widget/index.ts": '"use client";\nexport * from "./widget";\n',
    "src/widget/widget.tsx": '"use client";\nexport const Widget = 1;\n',
    "dist/index.js": "export {};\n",
    "dist/index.d.ts": "export declare function Notification(): void;\n",
    "dist/widget/index.js": '"use client";\nexport * from "./widget.js";\n',
    "dist/widget/widget.js": "export const Widget = 1;\n",
    "dist/Extra.js": "export {};\n",
    "dist/styles.css": "@layer qx.base { .qx-a { display: block; } }\n",
  });
  const { status, output } = run("node", [join(pkg, "scripts/check-dist.mjs"), root]);

  it("fails", () => expect(status).toBe(1));
  it.each([
    ['a lost "use client"', /dist\/widget\/widget\.js lost its "use client" directive/],
    ["an uppercase path", /dist\/Extra\.js has uppercase letters/],
    ["a family without an export", /src\/widget\/ has no "\.\/widget" export/],
    ["an export to a missing file", /export "\.\/ghost" points at missing/],
    ["a JavaScript wildcard export", /export "\.\/all\/\*" uses a wildcard/],
    [
      "a name that shadows a browser global",
      /exports Notification, which shadows a browser global/,
    ],
    ["a size over budget", /over its 0\.001 kB budget/],
  ])("catches %s", (_, message) => expect(output).toMatch(message));
});

describe("API version check", () => {
  const root = tree({
    "packages/react/etc/react.api.md":
      "export function Button(): void;\nexport function Card(): void;\n",
    "packages/react/package.json": JSON.stringify({ version: "0.1.4" }),
  });
  const git = (...args: string[]) => execFileSync("git", args, { cwd: root, stdio: "ignore" });
  git("init", "-q", "-b", "main");
  git("-c", "user.name=t", "-c", "user.email=t@t", "add", ".");
  git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "base");
  const check = () =>
    run("node", [join(repo, "scripts/check-api-version.mjs"), "main"], { cwd: root });
  const write = (report: string, version: string) => {
    writeFileSync(join(root, "packages/react/etc/react.api.md"), report);
    writeFileSync(join(root, "packages/react/package.json"), JSON.stringify({ version }));
  };

  it("allows an addition at a patch", () => {
    write(
      "export function Button(): void;\nexport function Card(): void;\nexport function Tabs(): void;\n",
      "0.1.5",
    );
    expect(check().status).toBe(0);
  });
  it("fails a removal at a patch, naming the version to raise to", () => {
    write("export function Button(): void;\n", "0.1.5");
    const { status, output } = check();
    expect(status).toBe(1);
    expect(output).toMatch(/Raise packages\/react\/package\.json to at least 0\.2\.0/);
  });
  it("allows a removal once the minor is raised", () => {
    write("export function Button(): void;\n", "0.2.0");
    expect(check().status).toBe(0);
  });
});

describe("React Compiler lint", () => {
  it("fails code that reads a ref during render", () => {
    const code =
      'import { useRef } from "react";\nexport function Bad(): number {\n  const ref = useRef(0);\n  return ref.current;\n}\n';
    const { status, output } = run(
      "node",
      [
        "tools/eslint/node_modules/eslint/bin/eslint.js",
        "--config",
        "tools/eslint/eslint.config.js",
        "--stdin",
        "--stdin-filename",
        "packages/react/src/probe/probe.tsx",
      ],
      { cwd: repo, input: code },
    );
    expect(status).toBe(1);
    expect(output).toMatch(/Cannot access refs during render/);
  }, 30_000);
});

describe("typecheck", () => {
  it("fails an exported function without an explicit return type (isolatedDeclarations)", () => {
    const root = tree({
      "tsconfig.json": JSON.stringify({
        extends: join(repo, "tsconfig.base.json"),
        compilerOptions: { noEmit: true, types: [] },
        include: ["probe.ts"],
      }),
      "probe.ts": "export function probe(value: number) {\n  return value * 2;\n}\n",
    });
    const { status, output } = run(join(repo, "node_modules/.bin/tsc"), [
      "-p",
      join(root, "tsconfig.json"),
    ]);
    expect(status).not.toBe(0);
    expect(output).toMatch(/TS9007|isolatedDeclarations/);
  }, 30_000);
});
