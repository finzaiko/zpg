var path = require("path");
var webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = function (env) {
  var pack = require("./package.json");
  var MiniCssExtractPlugin = require("mini-css-extract-plugin");

  var production = !!(env && env.production === "true");
  var asmodule = !!(env && env.module === "true");
  var standalone = !!(env && env.standalone === "true");

  var babelSettings = {
    extends: path.join(__dirname, "/.babelrc"),
  };

  //var sourcePath = path.join(__dirname, "codebase");
  //var prodPath = path.join(__dirname, "../backend/public/assets/");
  //console.log(`sourcepath>>`, sourcePath)
  //console.log(`prodPath>>`, prodPath)
  
  var config = {
    mode: production ? "production" : "development",
    entry: {
      myapp: "./sources/myapp.js",
    },
    output: {
      path: path.join(__dirname, "codebase"),
      publicPath: "/codebase/",
      filename: "[name].js",
      chunkFilename: "[name].bundle.js",
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: "babel-loader?" + JSON.stringify(babelSettings),
        },
        {
          test: /\.(svg|png|jpg|gif)$/,
          use: "url-loader?limit=25000",
        },
        {
          test: /\.(less|css)$/,
          use: [MiniCssExtractPlugin.loader, "css-loader", "less-loader"],
        },
      ],
    },
    stats: "minimal",
    resolve: {
      extensions: [".js"],
      modules: ["./sources", "node_modules"],
      alias: {
        "jet-views": path.resolve(__dirname, "sources/views"),
        "jet-locales": path.resolve(__dirname, "sources/locales"),
      },
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: "[name].css",
      }),
      new webpack.DefinePlugin({
        VERSION: `"${pack.version}"`,
        APPNAME: `"${pack.name}"`,
        PRODUCTION: production,
        BUILD_AS_MODULE: asmodule || standalone,
        "process.env": {
          SERVER_URL: JSON.stringify(env.server_url)
        },
      }),
      new CopyPlugin([
				{
            from: path.join(__dirname, "codebase/myapp.css"), 
            to: path.join(__dirname, "../backend/public/assets/"),
            force:true 
          },
				{
            from: path.join(__dirname, "codebase/myapp.js"), 
            to: path.join(__dirname, "../backend/public/assets/"),
            force:true 
          },
      ]),
    ],
    devServer: {
      stats: "errors-only",
    },
  };

  if (!production) {
    config.devtool = "inline-source-map";
  }

  if (asmodule) {
    if (!standalone) {
      config.externals = config.externals || {};
      config.externals = ["webix-jet"];
    }

    const out = config.output;
    const sub = standalone ? "full" : "module";

    out.library = pack.name.replace(/[^a-z0-9]/gi, "");
    out.libraryTarget = "umd";
    out.path = path.join(__dirname, "dist", sub);
    out.publicPath = "/dist/" + sub + "/";
  }

  return config;
};
