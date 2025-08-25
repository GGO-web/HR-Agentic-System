import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";

import baseConfig from "@workspace/eslint-config/eslint.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const files = ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"];

export default [
  ...baseConfig,
  ...compat.extends("plugin:@typescript-eslint/recommended"),
  {
    files,
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    ignores: ["dist/**"],
  },
];
