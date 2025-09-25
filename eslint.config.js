import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores([
    'dist',
    'node_modules',
    '*.config.js',
    '*.config.ts',
    'drizzle.config.ts',
    'vite-env.d.ts',
    'utils/',
  ]),
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript strict rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',

      // React rules
      'react-hooks/exhaustive-deps': 'error',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // General code quality
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    files: ['tests/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: ['./tests/tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript strict rules (relaxed for tests)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern:
            '^(supabase|mock|auth|response|testUser|externalUser|actualUnreadCount|waitFor)',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn', // Allow any in tests
      '@typescript-eslint/explicit-function-return-type': 'off', // Not needed in tests
      '@typescript-eslint/prefer-nullish-coalescing': 'off', // Can be relaxed in tests
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'off', // Allow for test assertions
      '@typescript-eslint/require-await': 'off', // Mock async functions don't need await
      '@typescript-eslint/no-unsafe-assignment': 'off', // Allow for test data setup
      '@typescript-eslint/await-thenable': 'off', // Allow await in test patterns
      '@typescript-eslint/no-floating-promises': 'off', // Allow for test patterns

      // General code quality
      'no-console': 'off', // Allow console in tests
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
]);
