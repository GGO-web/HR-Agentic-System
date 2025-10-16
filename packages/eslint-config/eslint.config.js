import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import importX from "eslint-plugin-import-x";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import prettierPlugin from "eslint-plugin-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  // Global ignores
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.turbo/**",
      "**/.vite/**",
      "**/.cache/**",
      "**/coverage/**",
      "turbo.json",
    ],
  },
  ...tseslint.config(js.configs.recommended, ...tseslint.configs.recommended, {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        project: true,
        tsconfigRootDir: resolve(__dirname, "../typescript-config/"),
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // Common TS prefs
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Encourage explicitness where helpful
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
      "@typescript-eslint/no-floating-promises": "error",
    },
  }),
  {
    name: "react-config",
    files: ["**/*.tsx"],
    plugins: {
      react: eslintPluginReact,
      "react-hooks": eslintPluginReactHooks,
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...eslintPluginReact.configs.recommended.rules,
      ...eslintPluginReactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },
  {
    name: "imports-config",
    files: ["**/*.ts", "**/*.tsx"],
    plugins: { "import-x": importX },
    settings: {
      "import-x/resolver": {
        node: { extensions: [".ts", ".tsx"] },
      },
    },
    rules: {
      "import-x/first": "error",
      "import-x/newline-after-import": "error",
      "import-x/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
            "type",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },
  {
    name: "vite-and-configs",
    files: [
      "vite.config.ts",
      "vitest.config.ts",
      "**/*.config.ts",
      "scripts/**/*.ts",
    ],
    languageOptions: {
      sourceType: "module",
      parserOptions: {
        project: true,
        tsconfigRootDir: resolve(__dirname, "../typescript-config/"),
      },
    },
  },
  {
    name: "prettier",
    plugins: { prettier: prettierPlugin },
    rules: {
      "prettier/prettier": [
        "error",
        {
          printWidth: 80,
          singleQuote: false,
          trailingComma: "all",
          bracketSpacing: true,
          arrowParens: "always",
          bracketSameLine: false,
          jsxSingleQuote: false,
          endOfLine: "auto",
          plugins: ["prettier-plugin-tailwindcss"],
        },
      ],
    },
  },
  eslintConfigPrettier,
  {
    rules: {
      "no-case-declarations": "off",
    },
  },
];
