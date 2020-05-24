import * as webpack from 'webpack'

module.exports = {
  mode: process.env.NODE_ENV,
  entry: {
    index: './index'
  },
  output: {
    path: __dirname,
    filename: '[name].bundle.js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' }
    ]
  },
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
} as webpack.Configuration
