const _ = require('lodash');
const path = require('path');
const webpack = require('webpack');

const isProduction = process.env.NODE_ENV === 'production';
const nodeEnv = isProduction ? 'production' : 'development';

const env = {
  NODE_ENV: nodeEnv,
  GIT_HASH: (process.env.GIT_HASH || '').trim(),
  GOOGLE_API_KEY: process.env.FRONTEND_GOOGLE_API_KEY,
  SENTRY_DSN: process.env.FRONTEND_SENTRY_DSN,
  SENTRY_ENVIRONMENT: process.env.FRONTEND_SENTRY_ENVIRONMENT,
  S3_CONTENT_BUCKET: process.env.S3_CONTENT_BUCKET
};

const plugins = [
  new webpack.DefinePlugin({
    'process.env': _.mapValues(env, v => JSON.stringify(v))
  })
];

module.exports = {
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? 'source-map' : 'cheap-source-map',
  entry: [
    './src/index.jsx',
    './style/style.scss'
  ],
  resolve: {
    extensions: ['.js', '.jsx']
  },
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, '../../build/agency'),
    publicPath: '/build/agency/'
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
      test: /\.scss$/,
      loaders: ['style-loader', 'css-loader', 'sass-loader']
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
