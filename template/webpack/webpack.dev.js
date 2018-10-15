const merge = require("webpack-merge");
const common = require("./webpack.common");
const proxyList = require("./proxy");
const convert = require("koa-connect");
const proxy = require("http-proxy-middleware");

const dev = {
  mode: "development",
  devtool: "inline-source-map"
};

// set up proxy
const proxyConfig = proxyList.length
  ? {
      serve: {
        add: app => {
          proxyList.forEach(({ match, ...rest }) => {
            app.use(convert(proxy(match, rest)));
          });
        }
      }
    }
  : {};

module.exports = merge(common, dev, proxyConfig);
