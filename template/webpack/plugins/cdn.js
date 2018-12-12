const pluginJson = require("./plugins.json");
const { name } = pluginJson.plugins.find(item => item.key === "cdn") || {};
module.exports = (function() {
  if (name) {
    const CdnPlugin = require("webpack-upload-plugin");
    const cdn = require(name);
    return [
      new CdnPlugin(cdn, {
        enableCache: true
      })
    ];
  }
  return [];
})();
