const merge = require("webpack-merge");
const webpack = require("webpack");
const common = require("./webpack.common");
const cdnPlugins = require("./plugins/cdn");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const prod = {
  output: {
    filename: "[name].[contenthash:7].js"
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("production")
      }
    }),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: "[name].[hash:7].css",
      chunkFilename: "[id].[hash:7].css"
    }),
    ...cdnPlugins
  ],
  mode: cdnPlugins.length ? "none" : "production"
};

module.exports = merge(common, prod);
