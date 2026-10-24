import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

// React Compiler and hooks rules only; Biome does everything else. Lints every package's source,
// tests included, so component code and test helpers both stay compiler-compatible.
// Run from the repository root (`bun run lint:compiler`): with --config, ESLint resolves file
// patterns from the working directory and plugins from this folder.
export default [
  {
    files: ["packages/*/src/**/*.{ts,tsx}", "packages/*/tests/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs["recommended-latest"].rules,
  },
];
