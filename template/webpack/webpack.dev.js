const webpack = require("webpack");
const merge = require("webpack-merge");
const common = require("./webpack.common");

const dev = {
  mode: "development",
  devtool: "inline-source-map",
  plugins: [
    new webpack.DefinePlugin({
      ENV: JSON.stringify("development")
    })
  ]
};

module.exports = merge(common, dev);
