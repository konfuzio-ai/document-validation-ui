module.exports = {
  setupFiles: ["./tests/setup.js"],
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
  testEnvironment: "jsdom",
  transformIgnorePatterns: ["node_modules/(?!axios|keycloak-js)"],
  transform: {
    "^.+\\.[t|j]sx?$": "babel-jest",
    "^.+\\.vue$": "@vue/vue3-jest",
  },
};
