const path = require('path');
const webpack = require('webpack');

const isProduction = process.env.NODE_ENV === 'production';
const nodeEnv = isProduction ? 'production' : 'development';

const plugins = [
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(nodeEnv),
      GOOGLE_API_KEY: JSON.stringify(process.env.FRONTEND_GOOGLE_API_KEY),
      SENTRY_DSN: JSON.stringify(process.env.FRONTEND_SENTRY_DSN),
      SENTRY_ENVIRONMENT: JSON.stringify(process.env.FRONTEND_SENTRY_ENVIRONMENT)
    }
  })
];

const prodPlugins = [
  new webpack.optimize.UglifyJsPlugin({
    minimize: true,
    compress: {
      warnings: false
    }
  })
];

const allPlugins = (isProduction ? prodPlugins : []).concat(plugins);

module.exports = {
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
  plugins: allPlugins,
  module: {
    rules: [{
    //   enforce: 'pre',
    //   test: /\.jsx?$/,
    //   loader: 'eslint-loader',
    //   include: path.join(__dirname, 'src')
    // }, {
      test: /\.jsx?$/,
      loader: 'babel-loader',
      include: path.join(__dirname, 'src')
    }, {
      test: /\.scss$/,
      loaders: ['style-loader', 'css-loader', 'sass-loader']
    }, {
      test: /\.json$/,
      loader: 'json-loader'
    }, {
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
