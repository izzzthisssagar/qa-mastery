// Shared flat ESLint config for React component packages (packages/ui,
// packages/widgets) that aren't themselves Next apps and so don't pull in
// eslint-config-next. Extends eslint.base.mjs with React/JSX rules and
// browser globals. See docs/superpowers/plans/
// 2026-07-26-release-repository-governance.md Task 2.
import globals from "globals";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

import { base } from "./eslint.base.mjs";

export const react = [
  ...base,
  {
    ...reactPlugin.configs.flat.recommended,
    files: ["**/*.{jsx,tsx}"],
    languageOptions: {
      ...reactPlugin.configs.flat.recommended.languageOptions,
      globals: { ...globals.browser },
    },
    plugins: {
      ...reactPlugin.configs.flat.recommended.plugins,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...reactPlugin.configs.flat.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
    settings: { react: { version: "detect" } },
  },
];

export default react;
