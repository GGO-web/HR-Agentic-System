import eslintConfig from "../../packages/eslint-config/eslint.config.js"

export default [
  ...eslintConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
]
