import { argosVitestPlugin } from "@argos-ci/vitest/plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, type ViteUserConfig } from "vitest/config";

// Two projects (decision D-10):
//   browser  every *.test.tsx: real Chromium through Playwright, for rendering, interaction,
//            keyboard, focus and axe. Firefox and WebKit run nightly.
//   server   every *.server.test.ts(x): Node, for server rendering and pure logic.
const config: ViteUserConfig = defineConfig({
  // Screenshots upload to Argos only from CI, and only once the repository is connected to Argos
  // (the ARGOS_UPLOAD variable), so local runs and forks never need an Argos account.
  plugins: [argosVitestPlugin({ uploadToArgos: process.env.ARGOS_UPLOAD === "true" })],
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
