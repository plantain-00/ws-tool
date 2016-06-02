const webpack = require("webpack");

module.exports = {
    entry: "./index",
    output: {
        filename: "index.bundle.js"
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false,
            },
            output: {
                comments: false,
            },
        }),
    ]
};
