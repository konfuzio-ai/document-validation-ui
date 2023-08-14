require("dotenv").config({ path: `.env.test` });
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  component: {
    devServer: {
      framework: "vue-cli",
      bundler: "webpack",
    },
  },
  viewportWidth: 1280,
  viewportHeight: 720,
});
