const merge = require("webpack-merge");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");
const common = require("./webpack.common");
const cdnPlugins = require("./plugins/cdn");

const prod = {
  output: {
    filename: "[name].[contenthash:7].js"
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("production")
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

// @sideeffects
// use MiniCssExtractPlugin.loader instead of 'style-loader'
const matchStyleLoader = loader => {
  if (typeof loader === "string") {
    return loader === "style-loader";
  }
  if (typeof loader === "object") {
    return loader.loader === "style-loader";
  }
  return false;
};
const rule = commonConfig.module.rules.find(r => {
  const isMultiRules = r.use && Array.isArray(r.use);
  if (!isMultiRules) return false;
  return r.use.some(matchStyleLoader);
});
if (rule) {
  const styleLoaderIndex = rule.use.findIndex(matchStyleLoader);
  rule.use.splice(styleLoaderIndex, 1, MiniCssExtractPlugin.loader);
}

module.exports = merge(common, prod);
