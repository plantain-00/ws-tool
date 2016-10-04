const webpack = require("webpack");

module.exports = {
    entry: {
        index: "./index",
        vendor: "./vendor"
    },
    output: {
        filename: "[name].bundle.js"
    },
    externals: {
        "vue": "Vue"
    },
    plugins: [
        new webpack.NoErrorsPlugin(),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false,
            },
            output: {
                comments: false,
            },
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: ["index", "vendor"]
        }),
    ]
};
