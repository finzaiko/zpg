const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const replace = require("replace");

module.exports = function (env) {
  var pack = require("./package.json");
  var MiniCssExtractPlugin = require("mini-css-extract-plugin");

  var production = !!(env && env.production === "true");
  var asmodule = !!(env && env.module === "true");
  var standalone = !!(env && env.standalone === "true");

  var babelSettings = {
    extends: path.join(__dirname, "/.babelrc"),
  };

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
          SERVER_URL: JSON.stringify(env.server_url),
          BUILD_MODE: JSON.stringify(env.buildmode),
        },
      }),
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

  if(production){
    console.log("Production build...");

    // IGNORE SIZE ASSET LIMIT WARNING
    config.performance = {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    };

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
    ]);

		replace({
			regex: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.18.0/min/",
			replacement: `${env.server_url}/assets/monaco-editor/`,
			paths: ["../backend/public/assets/monaco.js"],
			recursive: true,
			silent: true
		});

    const build = new Date() * 1;
		replace({
			regex: /[?][0-9]+/g,
			replacement: `?${build}`,
			paths: ["../backend/public/index.html"],
			recursive: true,
			silent: true
		});

  }

  return config;
};
