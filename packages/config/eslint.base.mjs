// Shared flat ESLint config for non-React TypeScript workspaces (pure
// packages, services, scripts). App-level configs (which use
// eslint-config-next) don't consume this; component packages layer
// eslint.react.mjs on top of it. See docs/superpowers/plans/
// 2026-07-26-release-repository-governance.md Task 2.
import tseslint from "typescript-eslint";

export const base = tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/*.d.ts",
    ],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
);

export default base;
