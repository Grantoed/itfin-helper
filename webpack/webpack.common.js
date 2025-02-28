const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const srcDir = path.join(__dirname, "..", "src");

module.exports = {
    entry: {
      app: path.join(srcDir, './app/app.tsx'),
      background: path.join(srcDir, './app/background.ts'),
    },
    output: {
        path: path.join(__dirname, "../dist/js"),
        filename: "[name].js",
    },
    optimization: {
        splitChunks: {
            name: "vendor",
            chunks(chunk) {
              return chunk.name !== 'background';
            }
        },
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.module\.scss$/,
                use: [
                    "style-loader", 
                    "css-loader?modules", 
                    "sass-loader",
                    "sass-migrator"
                ],
            },
            {
                test: /\.scss$/,
                exclude: /\.module\.scss$/,
                use: ["style-loader", "css-loader", "sass-loader", "sass-migrator"],
            }
        ],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
    plugins: [
        new CopyPlugin({
            patterns: [{ from: ".", to: "../", context: "public" }],
            options: {},
        }),
    ],
};
