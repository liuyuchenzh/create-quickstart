const webpack = require("webpack");
const pluginJson = require("./plugins.json");
const { name } = pluginJson.plugins.find(item => item.key === "cdn") || {};
module.exports = name
  ? [
      // bring concatenation back
      new webpack.optimize.ModuleConcatenationPlugin(),
      new require("webpack-upload-plugin")(require(name), {
        enableCache: true
      })
    ]
  : [];
