require('module-alias/register');

const ESLintPlugin = require('eslint-webpack-plugin');
const MomentTimezonePlugin = require('moment-timezone-data-webpack-plugin');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

const currentYear = new Date().getFullYear();
const plugins = [
  new ESLintPlugin({ configType: 'eslintrc' }),
  // To strip all locales except "en"
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
  devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',
  devServer: {
    port: 8082
  },
  entry: [
    './src/index.jsx',
    './style/app.less',
    './vendor/sweetalert.css',
    './vendor/sweetalert.min.js'
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      fptcore: path.resolve(__dirname, '../../fptcore/src/index.js')
    },
    fallback: {
      fs: false,
      net: false,
      tls: false,
      child_process: false,
      console: false
      // Remove other Node.js polyfills that aren't needed
    }
  },
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, '../../build/travel2'),
    publicPath: '/build/travel2/'
  },
  plugins: plugins,
  module: {
    rules: [{
      test: /\.jsx?$/,
      loader: 'babel-loader',
      options: {
        presets: [
          '@babel/preset-env',
          '@babel/preset-react'
        ]
      },
      include: [
        path.join(__dirname, 'src'),
        // Shouldn't need this -- just need it since react-leaflet and react-phone-number-input
        // use nullish coalescing operator. Maybe can remove node_modules from babel later.
        path.join(__dirname, 'node_modules/leaflet'),
        path.join(__dirname, 'node_modules/@react-leaflet'),
        path.join(__dirname, 'node_modules/react-leaflet')
      ]
    }, {
      test: /\.(less|css)$/i,
      use: [
        'style-loader',
        'css-loader',
        'less-loader'
      ]
    }, {
      test: /\.png$/,
      type: 'asset/resource'
    }, {
      test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      type: 'asset/resource'
    }, {
      test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      type: 'asset/resource'
    }]
  }
};
