# AGENTS.md — qeetrix-react

**The model-neutral instruction file for coding agents.** [CLAUDE.md](CLAUDE.md),
[GEMINI.md](GEMINI.md) and [.github/copilot-instructions.md](.github/copilot-instructions.md) point
here and add nothing.

## What this repository is

**`@qeetrix/react`**: the React components of **Qeetrix**, the Qeet Group design system. It's the
successor to `@qeetrix/ui`, which keeps working unchanged until every product has moved.

- **Stack:** React 19, Base UI (peer), `@qeetrix/tokens` (peer), TypeScript 7, bun.
- **Shape:** one bun workspace; the core package lives in `packages/react`. Heavy components get
  their own packages under `packages/` **only after the owner approves each one**.
- **Status:** `0.0.x`, Phase 3 (engineering platform). No components yet. Primitives arrive in
  Phase 4 increments.

It is a **library, not an app**: everything it exports is someone's dependency.

## Where the decisions live

The plan, the design language and the architecture are in `qeetgroup/qeetrix-files`, folder
`qeetrix-react/`. Read them before changing code:

| Document | For |
|---|---|
| `01-charter.md` | Principles, phases, **Definition of Done** (§7), component lifecycle |
| `02-inventory.md` | The three layers, the test for a primitive, the 37 primitives and their increments, the product-request process |
| `03-decisions.md` | D-01…D-15: Base UI, CSS delivery, packages, API conventions, forms, server components, testing, release |
| `05-design-rules.md` | How everything looks: shape, colour use, type, density, focus, current vs selected, motion |
| `06-component-specs.md` | Exact parts, sizes, states, API and accessibility for the 10 reference components |

## Commands

```bash
bun install                                   # use Bun 1.3.14: npx -y bun@1.3.14 install
bun install --cwd tools/eslint                # the compiler-lint tool (its own TypeScript 6)
bun x playwright install chromium             # once, for the browser tests

bun run build          # tsdown (JS + .d.ts, one file per module) → Lightning CSS (dist/styles.css, dist/css/*)
bun run typecheck      # tsc 7, strict, isolatedDeclarations
bun run lint           # Biome
bun run lint:compiler  # React Compiler and hooks rules (ESLint, from tools/eslint)
bun run format         # Biome, writing fixes
bun run test           # Vitest: real Chromium (*.test.tsx) + Node (*.server.test.ts[x])
bun run test:coverage  # the same, with the coverage floor
bun run check          # source rules, built-output rules, API report, publint + attw
bun run --filter '@qeetrix/react' api   # update etc/react.api.md after an intended API change
```

A newer Bun writes a lockfile version that CI's pinned Bun 1.3.14 can't read.

## What CI enforces

Every pull request and push runs `.github/workflows/ci.yml`. Each gate is itself proven to fail on a
deliberately broken example by `tests/gates.server.test.ts`, which runs on every CI run.

| Gate | Catches |
|---|---|
| Build | tsdown and Lightning CSS errors; CSS that doesn't parse for the browser baseline |
| Typecheck | Type errors; exports without explicit types (`isolatedDeclarations`) |
| Biome | Lint and formatting |
| Compiler lint | Code the React Compiler can't optimise, e.g. reading a ref during render |
| Source check | A client module without `"use client"`; `dangerouslySetInnerHTML`, `Math.random`, `localStorage`; CSS with raw colours, radii, shadows, type, motion or z-index; `!important`; classes without the `qx-` prefix |
| Built-output check | A lost `"use client"`; uppercase or colliding paths; a family without an export; exports to missing files or JS wildcards; names that shadow browser globals; size budgets (`size-budget.json`) |
| API report | `etc/react.api.md` out of date with the code |
| API version | A removed or changed API without a raised minor (`scripts/check-api-version.mjs`) |
| Package | publint and Are the Types Wrong? on the packed tarball |
| Tests | Real-browser interaction, keyboard and axe (WCAG A/AA, contrast on); server rendering; coverage floor (90% lines) |
| Screenshots | Every component in both colour schemes × three densities, compared on Argos (once connected) |
| Nightly | The browser tests again in Firefox and WebKit |

Releases: `release.yml` re-runs the gate on `main`, then waits for an approver in the
`npm-publish` environment, then publishes through npm trusted publishing with provenance.
`codeql.yml` and `scorecard.yml` run security analysis.

## Layout

```text
packages/react/
  src/index.ts            the public entry; every export is API
  src/<family>/           one folder per family: <family>.tsx, <family>.css, index.ts, tests
  src/styles/base.css     the qx.base layer
  scripts/build-css.mjs   compiles each <family>.css into the qx.components layer
  tsdown.config.ts        JS + declarations, unbundled
packages/react/tests/      platform tests, the gate self-tests, and support (axe, screenshots, stage)
packages/react/etc/        react.api.md, the public-API report
scripts/npm-versions.mjs   next unused patch on npm; release stops on versions npm has burned
scripts/check-api-version.mjs   a removed or changed API needs a raised minor
tools/eslint/              the isolated compiler-lint tool (TypeScript 6 for typescript-eslint)
```

## Rules

1. **Every export is public API.** A new export, prop, variant or slot is a patch while `0.x`.
   Removing or renaming one, or changing what it means, is a **minor**: raise it in
   `packages/react/package.json` by hand and write the `CHANGELOG.md` section.
2. **Behaviour from Base UI, look from Qeetrix.** Never copy shadcn or `@qeetrix/ui` code.
3. **Styles are plain CSS per family, tokens only.**
   - Write `src/<family>/<family>.css` with nesting, Base UI's `[data-*]` state attributes and
     `var(--qx-*)` values.
   - No raw colours, radii, shadows, durations or z-index values.
   - No `!important`, and no CSS imported from JS.
4. **Class names are stable**, `qx-<family>[-part]`, alongside a `data-slot` on every part.
5. **API conventions (D-12):**
   - `ref` is a plain prop, and polymorphism uses Base UI's `render`;
   - flat compound exports (`DialogTrigger`);
   - controlled state is `value` / `defaultValue` / `onValueChange(value, details)`, never
     `onChange(value)`;
   - style props are `variant`, `tone` and `size`; states are booleans.
6. **Client boundaries:** a module that uses Base UI, hooks or context starts with `"use client"`.
   Plain-HTML primitives stay server-safe.
7. **`className` is for layout only** (D-06). Visual changes go through props.
8. **No new dependency or package without the owner's approval.**

## Gotchas

- **TypeScript 7 has no JavaScript API.** Tools that need one (typescript-eslint, api-extractor)
  bring their own TypeScript. Typechecking always uses the workspace's TypeScript 7.
- **`isolatedDeclarations` is on:** exported functions and constants need explicit types, including
  in config files (`tsdown.config.ts` exports a typed `config`).
- **The CSS browser baseline is Tailwind v4's** (Safari 16.4, Chrome 111, Firefox 128); Lightning CSS
  lowers syntax for it.

## Escalate rather than proceed

Stop and report if a task would:
- remove or rename a public export, prop, variant, slot or class;
- weaken an accessibility guarantee;
- add a runtime dependency or a package;
- change the release workflows, licence or publish posture;
- require changing a sibling repository.
