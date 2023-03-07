module.exports = {
  runtimeCompiler: true,
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
  css: {
    extract: {
      filename: "css/[name].css?_hash=[contenthash:8]",
      chunkFilename: "css/[name].css?_hash=[contenthash:8]",
    },
  },
  configureWebpack: {
    output: {
      filename: "js/[name].js",
      chunkFilename: "js/[name].js",
    },
  },
};
