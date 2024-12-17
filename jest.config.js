module.exports = {
  preset: "@vue/cli-plugin-unit-jest/presets/no-babel",
  setupFiles: ["./tests/setup.js"],
  transformIgnorePatterns: ["node_modules/(?!axios|keycloak-js)"],
};
