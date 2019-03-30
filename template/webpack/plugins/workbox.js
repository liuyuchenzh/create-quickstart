// service worker
const WorkboxPlugin = require("workbox-webpack-plugin");

module.exports = [
  new WorkboxPlugin.GenerateSW({
    importWorkboxFrom: "local",
    swDest: "sw.js"
  })
];
