const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { getAssetsPath } = require("./util/assetsPath");
const { isMulti, entry, buildAll } = require("./config");

// output setup
const { dist } = require("../build/path");
// css setup
const { use: cssLoader, test } = require("./loader/cssloader.json");
// js setup
const {
  use: jsLoader,
  test: scriptTest,
  exclude,
  ext
} = require("./loader/jsloader.json");
// init webpack test field
const cssTest = new RegExp(test);
const jsTest = new RegExp(scriptTest);
const excludeReg = new RegExp(exclude);

let entryDirs = [];
if (buildAll) {
  entryDirs = fs.readdirSync(path.resolve(__dirname, "../src/pages"));
}

// spa
let webpackEntry = {
  app: path.resolve(__dirname, `../src/index.${ext}`)
};
if (buildAll) {
  webpackEntry = entryDirs.reduce((last, page) => {
    return Object.assign(last, {
      [page]: path.resolve(__dirname, `../src/pages/${page}/index.${ext}`)
    });
  }, {});
} else if (isMulti) {
  webpackEntry = {
    [entry]: path.resolve(__dirname, "../src/pages", entry, `index.${ext}`)
  };
}

// spa
let htmlPlugins = [
  new HtmlWebpackPlugin({
    template: path.resolve(__dirname, "../index.html"),
    filename: path.join(dist, "index.html")
  })
];

if (buildAll) {
  htmlPlugins = entryDirs.map(page => {
    return new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "../src/pages", page, "index.html"),
      filename: path.join(dist, `${page}.html`),
      chunks: [page]
    });
  });
} else if (isMulti) {
  htmlPlugins = [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "../src/pages", entry, "index.html"),
      filename: path.join(dist, `${entry}.html`),
      chunks: [entry]
    })
  ];
}

module.exports = {
  entry: webpackEntry,
  output: {
    path: dist,
    filename: "[name].[hash:7].js"
  },
  resolve: {
    extensions: [
      ".ts",
      ".tsx",
      ".wasm",
      ".mjs",
      ".js",
      ".jsx",
      ".json",
      ".less",
      ".css",
      ".scss",
      ".styl"
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
        use: [
          process.env.NODE_ENV === "development"
            ? "style-loader"
            : MiniCssExtractPlugin.loader,
          "css-loader",
          cssLoader
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: [
          {
            loader: "url-loader",
            options: {
              limit: 10000,
              name: `${getAssetsPath("/img/")}[name].[hash:7].[ext]`
            }
          }
        ]
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: "url-loader",
        options: {
          limit: 10000,
          name: `${getAssetsPath("/media/")}[name].[hash:7].[ext]`
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: "url-loader",
        options: {
          limit: 10000,
          name: `${getAssetsPath("/fonts/")}[name].[hash:7].[ext]`
        }
      }
    ]
  },
  plugins: [new CleanWebpackPlugin(), ...htmlPlugins]
};
