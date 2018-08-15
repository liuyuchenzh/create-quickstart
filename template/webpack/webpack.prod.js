const merge = require("webpack-merge");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");
const common = require("./webpack.common");

const prod = {
  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_EVN": JSON.stringify("production")
    }),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: "[name].[hash:7].css",
      chunkFilename: "[id].[hash:7].css"
    })
  ],
  mode: "production"
};

// @sideeffects
// use MiniCssExtractPlugin.loader instead of 'style-loader
const rule = common.module.rules.find(
  r => r.use && Array.isArray(r.use) && r.use.includes("style-loader")
);
if (rule) {
  const styleLoaderIndex = rule.use.findIndex(r => r === "style-loader");
  rule.use.splice(styleLoaderIndex, 1, MiniCssExtractPlugin.loader);
}

module.exports = merge(common, prod);
