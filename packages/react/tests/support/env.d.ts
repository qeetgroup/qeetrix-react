// Types for what the test setup imports through Vite: stylesheets as side effects, and Vite's
// import.meta.glob. Declared here so the typecheck doesn't need Vite installed at the top level.
declare module "*.css";

interface ImportMeta {
  glob(pattern: string, options?: { eager?: boolean }): Record<string, unknown>;
}
