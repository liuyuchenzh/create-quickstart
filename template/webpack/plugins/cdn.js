const webpack = require("webpack");
const pluginJson = require("./plugins.json");
const { name } = pluginJson.plugins.find(item => item.key === "cdn") || {};
module.exports = (function() {
  if (name) {
    const CdnPlugin = require("webpack-upload-plugin");
    const cdn = require(name);
    return [
      // bring concatenation back
      new webpack.optimize.ModuleConcatenationPlugin(),
      new CdnPlugin(cdn, {
        enableCache: true
      })
    ];
  }
  return [];
})();
