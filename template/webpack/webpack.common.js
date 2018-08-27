const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const { dist } = require("../build/path");
const { use: cssLoader, test } = require("./loader/cssloader.json");
const {
  use: jsLoader,
  test: scriptTest,
  exclude,
  ext
} = require("./loader/jsloader.json");
const cssTest = new RegExp(test);
const jsTest = new RegExp(scriptTest);
const excludeReg = new RegExp(exclude);

module.exports = {
  entry: {
    app: path.resolve(__dirname, `../src/index.${ext}`)
  },
  output: {
    path: dist,
    filename: "[name].[hash:7].js"
  },
  resolve: {
    extensions: [
      ".ts",
      ".wasm",
      ".mjs",
      ".js",
      ".json",
      ".less",
      ".css",
      ".scss"
    ]
  },
  module: {
    rules: [
      {
        test: jsTest,
        exclude: excludeReg,
        use: jsLoader
      },
      {
        test: cssTest,
        use: ["style-loader", "css-loader", cssLoader]
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: [
          {
            loader: "url-loader",
            options: {
              name: "/img/[name].[hash:7].[ext]"
            }
          }
        ]
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: "url-loader",
        options: {
          limit: 10000,
          name: "/media/[name].[hash:7].[ext]"
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: "url-loader",
        options: {
          limit: 10000,
          name: "/fonts/[name].[hash:7].[ext]"
        }
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin([dist]),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "../index.html"),
      filename: path.join(dist, "index.html")
    })
  ]
};
