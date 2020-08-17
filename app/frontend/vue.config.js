module.exports = {
  transpileDependencies: [
    "vuetify"
  ],
  configureWebpack: {
    devtool: 'source-map'
  },
  chainWebpack: (config) => {
    config
      .plugin('html')
      .tap((args) => {
        args[0].title = 'Couchers.org alpha';
        return args;
      });
  },
}
