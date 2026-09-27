import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'exports/**',
      'data/**',
      'node_modules/**',
      'src-tauri/gen/**',
      'src-tauri/target/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['src/client/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['src/server/**/*.js', 'tests/**/*.js', '*.config.js'],
    languageOptions: { globals: { ...globals.node, ...globals.es2022 } },
  },
  {
    files: ['src/shared/**/*.js'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.es2024 },
    },
  },
];
