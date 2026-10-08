import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default [
  {
    files: ['packages/shared/src/**/*.ts'],
    ignores: ['**/*.test.ts', '**/generated/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            'node:*',
            '@rwa/worker',
            '@rwa/worker/*',
            '@rwa/web',
            '@rwa/web/*',
            '**/server/**',
          ],
        },
      ],
      'no-restricted-globals': ['error', 'process'],
    },
  },
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/out/**',
      '**/cache/**',
      '**/generated/**',
      '**/next-env.d.ts',
      'research/**',
      'output/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextVitals.map((config) => ({
    ...config,
    files: ['apps/web/**/*.{ts,tsx}'],
  })),
  {
    files: ['**/*.{mjs,ts,tsx}'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        AbortController: 'readonly',
      },
    },
    settings: { next: { rootDir: 'apps/web/' } },
  },
  {
    files: ['**/*.mjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
];
