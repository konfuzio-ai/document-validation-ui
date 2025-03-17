module.exports = {
  moduleFileExtensions: [
    "vue",
    "js",
    "mjs",
    "cjs",
    "jsx",
    "ts",
    "tsx",
    "json",
    "node",
  ],
  moduleNameMapper: {
    "\\.(css|less)$": "<rootDir>/tests/mock/styleMock.js",
  },
  testEnvironment: "jsdom",
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
  transformIgnorePatterns: ["node_modules/(?!axios|keycloak-js)"],
  transform: {
    "^.+\\.[t|j]sx?$": "babel-jest",
    "^.+\\.vue$": "@vue/vue3-jest",
  },
};
