module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'script',
  },
  extends: ['eslint:recommended', 'prettier'],
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_|next', varsIgnorePattern: '^_' }],
    'no-console': 'off',
    eqeqeq: ['error', 'always'],
    'prefer-const': 'error',
  },
  ignorePatterns: ['node_modules/', 'dist/', 'coverage/'],
};
