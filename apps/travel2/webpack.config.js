require('module-alias/register');

const MomentTimezonePlugin = require('moment-timezone-data-webpack-plugin');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

const currentYear = new Date().getFullYear();
const plugins = [
  // To strip all locales except “en”
  new MomentLocalesPlugin(),
  // To include only specific zones, use the matchZones option
  new MomentTimezonePlugin({
    matchZones: /^(US|Europe)/,
    startYear: currentYear - 5,
    endYear: currentYear + 5
  })
];

module.exports = {
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? 'source-map' : 'cheap-source-map',
  entry: [
    './src/index.jsx',
    './style/app.less'
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      fptcore: path.resolve(__dirname, '../../fptcore/src/index.js')
    }
  },
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, '../../build/travel2'),
    publicPath: '/build/travel2/'
  },
  node: {
    console: true,
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    dl: 'empty',
    uriparser: 'empty',
    child_process: 'empty'
  },
  plugins: plugins,
  module: {
    rules: [{
    //   enforce: 'pre',
    //   test: /\.jsx?$/,
    //   loader: 'eslint-loader',
    //   include: path.join(__dirname, 'src')
    // }, {
      test: /\.jsx?$/,
      loader: 'babel-loader',
      options: {
        presets: [
          '@babel/preset-env',
          '@babel/preset-react'
        ]
      },
      include: [
        path.join(__dirname, 'src')
        // path.join(__dirname, 'node_modules/fptcore/src')
      ]
    }, {
      test: /\.s?css$/,
      loaders: ['style-loader', 'css-loader', 'sass-loader']
    }, {
      test: /\.less$/i,
      loaders: [
        // compiles Less to CSS
        'style-loader',
        'css-loader',
        'less-loader'
      ]
    }, {
    //   test: /\.json$/,
    //   loader: 'json-loader'
    // }, {
      test: /\.png$/,
      loader: 'file-loader?name=[name].[ext]'
    }, {
      test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'url-loader?limit=10000&name=[name].[ext]'
    }, {
      test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'url-loader?limit=10000&name=[name].[ext]'
    }]
  }
};
