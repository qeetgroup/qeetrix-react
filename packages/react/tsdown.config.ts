import { defineConfig, type UserConfig } from "tsdown";

// One output file per source module (unbundled), so every component is its own module, keeps its
// "use client" directive, and tree-shakes on its own. Declarations come from isolatedDeclarations.
const config: UserConfig = defineConfig({
  // The root entry, one entry per component family (src/<family>/index.ts), and one per locale pack
  // (src/locales/<locale>.ts), so a language a product doesn't use never ships.
  entry: ["src/index.ts", "src/*/index.ts", "src/locales/*.ts"],
  unbundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2022",
  outDir: "dist",
  clean: true,
  dts: true,
  deps: { neverBundle: [/^react($|\/)/, /^react-dom($|\/)/, /^@base-ui\//, /^@qeetrix\//] },
  inputOptions: {
    // Rolldown warns that a bundle may drop "use client". Unbundled output keeps it, and
    // scripts/check-dist.mjs fails the build if any client module loses it.
    onLog(level, log, handler) {
      if (log.code !== "MODULE_LEVEL_DIRECTIVE") handler(level, log);
    },
  },
});

export default config;
