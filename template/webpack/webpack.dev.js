const webpack = require("webpack");
const merge = require("webpack-merge");
const common = require("./webpack.common");
const proxy = require("./proxy");

// set up proxy
const proxyConfig = Object.keys(proxy).length ? { proxy } : {};

const dev = {
  mode: "development",
  devtool: "inline-source-map",
  devServer: Object.assign(
    {
      hot: true,
      open: true
    },
    proxyConfig
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
