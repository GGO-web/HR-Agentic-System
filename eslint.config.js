import sharedConfig from "./packages/eslint-config/eslint.config.js";

export default [
  // Global ignores for root-level files
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.turbo/**",
      "**/.vite/**",
      "**/.cache/**",
      "**/coverage/**",
      "package.json",
      "pnpm-lock.yaml",
      "pnpm-workspace.yaml",
      ".gitignore",
      ".editorconfig",
      "turbo.json",
      "**/*.json",
      "**/*.yaml",
      "**/*.yml",
    ],
  },
  ...sharedConfig,
];
