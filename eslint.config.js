import js from '@eslint/js';
import vuePlugin from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
    ],
  },

  // Base rules for all JS/Vue files in the repo.
  js.configs.recommended,

  // Frontend (Vue 3 + browser environment).
  ...vuePlugin.configs['flat/recommended'].map((config) => ({
    ...config,
    files: ['frontend/**/*.vue', 'frontend/**/*.js'],
  })),
  {
    files: ['frontend/**/*.vue'],
    languageOptions: {
      parser: vueParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ['frontend/**/*.js'],
    ignores: ['frontend/scripts/**'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
  },

  // Backend + E2E-Tests (Node.js environment). Also covers frontend/scripts:
  // build-time helpers (e.g. apply-assets.mjs) run under Node, not a
  // browser, so they need Node globals (process, ...) instead.
  {
    files: ['backend/**/*.js', 'e2e/**/*.js', 'frontend/scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },
];
