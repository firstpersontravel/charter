import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import mochaPlugin from 'eslint-plugin-mocha';

const mochaConfig = {
  ...mochaPlugin.configs.flat.recommended,
  rules: {
    ...mochaPlugin.configs.flat.recommended.rules,
    "mocha/no-mocha-arrows": "off",
    "mocha/no-setup-in-describe": "off",
    "mocha/no-skipped-tests": "off",
    "mocha/no-top-level-hooks": "off",
    "mocha/no-sibling-hooks": "off",
  }
};

const jsConfig = {
  files: ["**/*.{js,mjs,cjs}"],
  plugins: { js },
  extends: ["js/recommended"],
  rules: {
    "no-unused-vars": "off"
  }
};

export default defineConfig([
  mochaConfig,
  jsConfig,
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  { files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.node } },
]);
