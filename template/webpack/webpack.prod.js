const merge = require("webpack-merge");
const webpack = require("webpack");
const common = require("./webpack.common");
const cdnPlugins = require("./plugins/cdn");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const usingCdn = cdnPlugins.length > 0;

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
      filename: "[name].[contenthash:7].css",
      chunkFilename: "[id].[contenthash:7].css"
    }),
    ...cdnPlugins
  ],
  mode: "production",
  optimization: {
    minimize: !usingCdn
  }
};

module.exports = merge(common, prod);
