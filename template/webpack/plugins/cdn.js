const pluginJson = require("./plugins.json");
const { name } = pluginJson.plugins.find(item => item.key === "cdn") || {};
module.exports = name
  ? [
      new require("webpack-upload-plugin")(require(name), {
        enableCache: true
      })
    ]
  : [];
