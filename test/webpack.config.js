const glob = require("glob");

module.exports = {
  context: __dirname,
  mode: "development",
  devtool: "inline-source-map",
  entry: glob.sync('./**/*.spec.js'),
  output: {
    path: __dirname + "/dist",
    filename: "bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.(xhtml|opf)$/,
        loader: "raw-loader"
      }
    ]
  }
};