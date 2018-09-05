const isDev = process.env.NODE_ENV === 'development'

module.exports = {
  mode: process.env.NODE_ENV,
  entry: {
    index: './index'
  },
  output: {
    path: __dirname,
    filename: '[name].bundle.js'
  },
  resolve: isDev ? {
    extensions: ['.ts', '.tsx', '.js']
  } : undefined,
  module: isDev ? {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' }
    ]
  } : undefined,
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all'
        }
      }
    }
  }
}
