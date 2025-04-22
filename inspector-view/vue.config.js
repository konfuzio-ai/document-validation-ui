module.exports = {
  lintOnSave: false,
  devServer: {
    port: 8081,
    proxy: {
      '/api': {
        target: process.env.VUE_APP_API_URL || 'https://testing.konfuzio.com',
        changeOrigin: true
      }
    }
  }
} 