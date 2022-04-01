const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const VueLoaderPlugin = require("vue-loader/lib/plugin");
const path = require("path");
require("dotenv").config({ path: "./.env" });
module.exports = {
  mode: "production",
  entry: {
    document_dashboard: "./app/index.js",
  },
  output: {
    path: __dirname + "/public/data",
    publicPath: "/public",
    filename: "[name].js",
    sourceMapFilename: "[name].js.map",
  },
  performance: {
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  devServer: {
    // Serve index.html as the base
    static: {
      directory: path.join(__dirname, "./public"),
    },
    compress: true,
    host: "localhost",
    port: 3000,
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader",
        options: {
          sourceMap: true,
        },
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
          },
        ],
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
    new webpack.DefinePlugin({
      "process.env": JSON.stringify(process.env),
    }),
  ],
  resolve: {
    extensions: [".js", ".vue"],
    alias: {
      vue$: "vue/dist/vue.esm.js",
    },
  },
};
