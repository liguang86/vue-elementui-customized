const path = require('path')

function resolve (dir) {
  return path.join(__dirname, dir)
}

module.exports = {
  runtimeCompiler: true,
  publicPath: './',
  productionSourceMap: false,
  pages: {
    index: {
      entry: 'example/main.js',
      template: 'public/index.html',
      filename: 'index.html'
    }
  },
  chainWebpack: (config) => {
    config.resolve.alias
      .set('element-ui', resolve('src/elementui'))
  }
}
