module.exports = {
  lintOnSave: false,
  publicPath: './',
  devServer: {
    port: 8081,
    proxy: {
      '/api': {
        target: process.env.VUE_APP_API_URL || 'https://testing.konfuzio.com',
        changeOrigin: true
      }
    }
  },
  chainWebpack: config => {
    config.plugin('define').tap(args => {
      const env = process.env;
      args[0]['process.env'] = Object.keys(env).reduce((acc, key) => {
        if (key.startsWith('VUE_APP_')) {
          acc[key] = JSON.stringify(env[key]);
        }
        return acc;
      }, {});
      return args;
    });
  }
} 