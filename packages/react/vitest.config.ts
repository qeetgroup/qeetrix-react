import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { argosVitestPlugin } from "@argos-ci/vitest/plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, type ViteUserConfig } from "vitest/config";

// Every Base UI part and icon the code imports, pre-bundled before the browser tests start. Left to
// discovery, Vite finds them mid-run, re-optimises and reloads the page, and tests then see two
// copies of React.
const deepImports = [
  ...new Set(
    ["src", "tests"]
      .flatMap((dir) =>
        readdirSync(dir, { recursive: true, encoding: "utf8" }).map((f) => join(dir, f)),
      )
      .filter((file) => /\.tsx?$/.test(file))
      .flatMap((file) =>
        [
          ...readFileSync(file, "utf8").matchAll(
            /from "(@base-ui\/react\/[\w-]+|@qeetrix\/icons\/icons\/[\w-]+)"/g,
          ),
        ].map((m) => m[1] as string),
      ),
  ),
].sort();

// Two projects (decision D-10):
//   browser  every *.test.tsx: real Chromium through Playwright, for rendering, interaction,
//            keyboard, focus and axe. Firefox and WebKit run nightly.
//   server   every *.server.test.ts(x): Node, for server rendering and pure logic.
const config: ViteUserConfig = defineConfig({
  // Screenshots upload to Argos only from CI, and only once the repository is connected to Argos
  // (the ARGOS_UPLOAD variable), so local runs and forks never need an Argos account.
  plugins: [argosVitestPlugin({ uploadToArgos: process.env.ARGOS_UPLOAD === "true" })],
  optimizeDeps: { include: deepImports },
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/index.ts"],
      thresholds: { lines: 90, functions: 90, statements: 90, branches: 85 },
    },
    projects: [
      {
        extends: true,
        test: {
          name: "server",
          environment: "node",
          include: ["{src,tests}/**/*.server.test.{ts,tsx}"],
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          include: ["{src,tests}/**/*.test.tsx"],
          exclude: ["**/*.server.test.tsx"],
          setupFiles: ["tests/support/setup.ts"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            // Chromium on every run; the nightly job adds Firefox and WebKit (QX_BROWSERS).
            instances: (process.env.QX_BROWSERS ?? "chromium").split(",").map((browser) => ({
              browser: browser.trim() as "chromium" | "firefox" | "webkit",
            })),
          },
        },
      },
    ],
  },
});

export default config;
