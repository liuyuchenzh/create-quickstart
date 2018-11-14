const dev = require("./webpack/webpack.dev");
const prod = require("./webpack/webpack.prod");

const IS_DEV = process.env.NODE_ENV === "development";
module.exports = IS_DEV ? dev : prod;
