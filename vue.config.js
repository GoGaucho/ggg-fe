module.exports = {
  publicPath: '/gold/',
  outputDir: 'gold',

  devServer: {
    proxy: {
      '/api/': {
        target: 'https://gogaucho-app.herokuapp.com/',
        changeOrigin: true,
      }
    },
    before: (app) => {}
  },

  assetsDir: './'
}