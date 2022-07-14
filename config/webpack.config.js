const HtmlWebpackPlugin = require("html-webpack-plugin");
const EslintWebpackPlugin = require("eslint-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const { VueLoaderPlugin } = require("vue-loader");
const { DefinePlugin } = require("webpack");
const path = require("path");
const isProduction = process.env.NODE_ENV === 'production'

function getStyleLoaders(pre) {
    return [
        isProduction ? MiniCssExtractPlugin.loader : 'vue-style-loader',
        'css-loader',
        {
            loader: 'postcss-loader',
            options: {
                postcssOptions: {
                    plugins: ["postcss-preset-env"] // 能解决大部分样式兼容问题, 需要在package.json中指定处理的程度范围
                }
            }
        },
        pre
    ].filter(pre => pre)
}

module.exports = {
    entry: {
        main: path.resolve(__dirname, "../src/main.js")
    },
    output: {
        filename: isProduction ? "js/[name].[contenthash:10].js" : "js/[name].js",
        chunkFilename: isProduction ? "js/[name].[contenthash:10].chunk.js" : "js/[name].chunk.js",
        assetModuleFilename: "static/[hash][ext][query]",
        path: isProduction ? path.resolve(__dirname, "../dist") : undefined,
        clean: true
    },
    module: {
        rules: [
            // 处理vue文件
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    cacheDirectory: path.resolve(__dirname, "../node_modules/.cache/vue-loader-cache")
                }
            },
            // 处理css
            {
                test: /\.css$/,
                use: getStyleLoaders()
            },
            // 处理scss
            {
                test: /\.s[ac]ss$/,
                use: getStyleLoaders('sass-loader')
            },
            // 处理图片
            {
                test: /\.(jpe?g|png|webp|svg|gif)$/,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 10 * 1024
                    }
                }
            },
            // 处理其他资源
            {
                test: /\.(woff2?|ttf)$/,
                type: 'asset/resource'
            },
            // 处理js
            {
                test: /\.js$/,
                include: path.resolve(__dirname, "../src"),
                loader: "babel-loader",
                options: {
                    cacheDirectory: true,
                    cacheCompression: false
                }
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "../public/index.html")
        }),
        new EslintWebpackPlugin({
            context: path.resolve(__dirname, "../src"),
            exclude: "node_modules",
            cache: true,
            cacheLocation: path.resolve(__dirname, "../node_modules/.cache/eslintCache")
        }),
        isProduction && new MiniCssExtractPlugin({
            filename: "styles/[name].css",
            chunkFilename: "styles/[name].[contenthash:10].css"
        }),
        isProduction && new CopyPlugin({
            patterns: [{
                from: path.resolve(__dirname, "../public"),
                to: path.resolve(__dirname, "../dist"),
                globOptions: {
                    dot: true,
                    gitignore: true,
                    ignore: ["**/index.html"],
                }
            }, ]
        }),
        new VueLoaderPlugin(),
        // cross-env定义的环境变量是给打包工具使用的
        // DefinePlugin定义的环境变量是给源代码使用，解决vue3页面警告问题
        new DefinePlugin({
            __VUE_OPTIONS_API__: true, // 使用选项式API
            __VUE_PROD_DEVTOOLS__: false // 是否开启生产模式下的devtools调试工具
        })
    ].filter(pre => pre),
    optimization: {
        splitChunks: {
            chunks: 'all'
        },
        runtimeChunk: {
            name: (entrypoint) => `runtime~${entrypoint.name}.js`
        },
        minimize: isProduction,
        minimizer: [new CssMinimizerPlugin(), new TerserWebpackPlugin()]
    },
    resolve: {
        extensions: ['.vue', '.js', '.json'],
        alias: {
            '@': path.resolve(__dirname, "../src")
        }
    },
    // 开启开发服务器
    devServer: {
        host: 'localhost',
        port: 80,
        open: true,
        hot: true // 开启热模块替换
    },
    // 开启sourcemap，打包成生成map文件方便代码调试
    devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
    mode: isProduction ? 'production' : 'development'
}