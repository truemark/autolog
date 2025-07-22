/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
  singleQuote: true, // differs from default
  quoteProps: 'consistent', // differs from default
  bracketSpacing: false, // differs from default
  overrides: [
    {
      files: ['**/*'],
      excludeFiles: ['pnpm-lock.yaml', 'cdk.out', 'node_modules'],
    },
  ],
};

export default config;
