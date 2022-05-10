const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  pluginOptions: {
    i18n: {
      locale: "en",
      fallbackLocale: "en",
      localeDir: "locales",
      enableInSFC: true,
      includeLocales: false,
      enableBridge: true,
    },
  },
  // Make variables available in SASS for every components
  css: {
    loaderOptions: {
      sass: {
        additionalData: `
          @import '@/assets/scss/variables.scss';
        `,
      },
    },
  },
});
