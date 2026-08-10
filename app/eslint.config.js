// ESLint flat config for Expo (ESLint 9)
// 使用官方 expo 共享配置，覆盖 React Native / Expo Router 的规则
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // 项目级自定义规则
    ignores: ["dist/**", "node_modules/**", ".expo/**"],
  },
]);
