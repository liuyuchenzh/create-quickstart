const UploadPlugin = require("webpack-upload-plugin");
const pluginJson = require("./plugins.json");
const { name } = pluginJson.plugins.find(item => item.key === "cdn") || {};
module.exports = name
  ? [
      new UploadPlugin(require(name), {
        enableCache: true
      })
    ]
  : [];
