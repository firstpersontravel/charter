require('module-alias/register');

const MomentTimezonePlugin = require('moment-timezone-data-webpack-plugin');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

const currentYear = new Date().getFullYear();
const plugins = [
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
  devtool: isProduction ? 'source-map' : 'cheap-source-map',
  entry: [
    './src/index.jsx',
    './style/style.scss',
    './node_modules/react-phone-number-input/style.css'
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      fptcore: path.resolve(__dirname, '../../fptcore/src/index.js')
    },
    fallback: {
      // Webpack 5 no longer polyfills Node.js core modules automatically
      // For modules that should be empty, use 'false' instead of 'empty'
      fs: false,
      net: false,
      tls: false,
      child_process: false,
      // These were previously set to 'empty'
      dl: false,
      uriparser: false
    }
  },
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, '../../build/agency'),
    publicPath: '/build/agency/'
  },
  // Removed 'node' configuration as it's deprecated in Webpack 5
  plugins: plugins,
  module: {
    rules: [{
      test: /\.jsx?$/,
      use: [{
        loader: 'babel-loader',
        options: {
          presets: [
            '@babel/preset-env',
            '@babel/preset-react'
          ]
        }
      }],
      include: [
        path.join(__dirname, 'src'),
        // Shouldn't need this -- just need it since react-leaflet and react-phone-number-input
        // use nullish coalescing operator. Maybe can remove node_modules from babel later.
        path.join(__dirname, 'node_modules/leaflet'),
        path.join(__dirname, 'node_modules/@react-leaflet'),
        path.join(__dirname, 'node_modules/react-leaflet')
      ]
    }, {
      test: /\.s?css$/,
      use: [
        {
          loader: 'style-loader'
        },
        {
          loader: 'css-loader'
        },
        {
          loader: 'sass-loader'
        }
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
