// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

const config = [
  {
    ignores: ['src/**/*.mjs', 'src/**/*.d.*'],
  },
  ...tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
      rules: {
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/no-empty-object-type': 'warn',
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    },
  ),
];
export default config;
