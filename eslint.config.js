import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import reactHooks from 'eslint-plugin-react-hooks';

export default defineConfig([
  globalIgnores(['dist/**', '.astro/**', 'node_modules/**', '.playwright-mcp/**', '.vercel/**']),

  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,

  // Browser APIs (localStorage, document, navigator, WakeLock, Document PiP)
  // are used throughout src/, and the timer runs entirely client side.
  {
    files: ['src/**/*.{ts,tsx,astro}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },

  {
    files: ['src/**/*.tsx'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Astro generates this file and references its own generated types by path.
  {
    files: ['src/env.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },

  // Config files run in Node, not the browser.
  {
    files: ['*.config.{js,mjs,ts}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  {
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
]);
