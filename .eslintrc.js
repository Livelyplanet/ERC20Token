module.exports = {
  env: {
    browser: false,
    es2021: true,
    mocha: true,
    node: true,
    "truffle/globals": true,
  },
  plugins: ["truffle"],
  extends: [
    "eslint:recommended",
    "standard",
    "plugin:prettier/recommended",
    "plugin:node/recommended",
  ],
  parserOptions: {
    ecmaVersion: 13,
  },
  rules: {
    "node/no-unpublished-require": "off",
  },
};
