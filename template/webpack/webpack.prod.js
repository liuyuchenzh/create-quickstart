const merge = require("webpack-merge");
const webpack = require("webpack");
const common = require("./webpack.common");
const { usingCdn, usingSW } = require("./cli-config.json");
const cdnPlugins = usingCdn ? require("./plugins/cdn"): [];
const workboxPlugins = usingSW ? require("./plugins/workbox"): [];
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
      filename: "[name].[contenthash:7].css",
      chunkFilename: "[id].[contenthash:7].css"
    }),
    ...cdnPlugins,
    ...workboxPlugins
  ],
  mode: "production",
  optimization: {
    minimize: !usingCdn
  }
};

module.exports = merge(common, prod);
