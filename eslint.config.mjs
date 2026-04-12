import js from "@eslint/js";
import nextPlugin from "eslint-config-next";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextPlugin,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "convex/_generated/**",
      "playwright-report/**",
      "test-results/**",
      "coverage/**",
    ],
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
