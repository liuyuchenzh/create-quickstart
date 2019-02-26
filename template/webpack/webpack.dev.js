const webpack = require("webpack");
const merge = require("webpack-merge");
const common = require("./webpack.common");
const proxy = require("./proxy");
const { entry, isMulti, buildAll } = require("./config");

// set up proxy
const proxyConfig = Object.keys(proxy).length ? { proxy } : {};
// open specific page when using multi-page
const pageConfig =
  isMulti && !buildAll
    ? {
        openPage: `${entry}.html`
      }
    : {};

const dev = {
  mode: "development",
  devtool: "inline-source-map",
  devServer: Object.assign(
    {},
    {
      hot: true,
      open: true
    },
    proxyConfig,
    pageConfig
  ),
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("development")
      }
    })
  ]
};

module.exports = merge(common, dev);
