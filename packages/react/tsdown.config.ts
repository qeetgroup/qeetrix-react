import { defineConfig, type UserConfig } from "tsdown";

// One output file per source module (unbundled), so every component is its own module, keeps its
// "use client" directive, and tree-shakes on its own. Declarations come from isolatedDeclarations.
const config: UserConfig = defineConfig({
  entry: ["src/index.ts"],
  unbundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2022",
  outDir: "dist",
  clean: true,
  dts: true,
  deps: { neverBundle: [/^react($|\/)/, /^react-dom($|\/)/, /^@base-ui\//, /^@qeetrix\//] },
});

export default config;
