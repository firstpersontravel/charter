/* global require, module */
var Funnel = require('broccoli-funnel');
var MergeTrees = require('broccoli-merge-trees');
var EmberApp = require('ember-cli/lib/broccoli/ember-app');

var rollupJsonPlugin = require('rollup-plugin-json');
var rollupBuiltinsPlugin = require('rollup-plugin-node-builtins');
var rollupGlobalsPlugin = require('rollup-plugin-node-globals');
var rollupBabelPlugin = require('rollup-plugin-babel');

module.exports = function(defaults) {

  var PRODUCTION_ENVS = ['production', 'staging'];
  var isProduction = PRODUCTION_ENVS.indexOf(process.env.EMBER_ENV) >= 0;

  var app = new EmberApp(defaults, {
    minifyCSS: {
      enabled: isProduction
    },
    minifyJS: {
      enabled: isProduction
    },
    sourcemaps: {
      enabled: true
    }
  });

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.

  var cssFiles = new Funnel('node_modules/font-awesome/css', {
    destDir: 'assets/css'
  });
  var fontFiles = new Funnel('node_modules/font-awesome/fonts', {
    destDir: 'assets/fonts'
  });

  app.import('node_modules/fptcore/src/index.js', {
    using: [{
      transformation: 'cjs',
      as: 'fptcore',
      plugins: [
        rollupBabelPlugin(),
        rollupJsonPlugin(),
        rollupGlobalsPlugin(),
        rollupBuiltinsPlugin()
      ]
    }]
  });

  app.import('node_modules/twilio-video/dist/twilio-video.js');

  app.import('node_modules/featherlight/release/featherlight.min.css');
  app.import('node_modules/featherlight/release/featherlight.min.js');

  app.import('node_modules/polyline-encoded/Polyline.encoded.js');

  // Copy-pasta'd from /pubsub/faye/client.js
  app.import('vendor/faye-client.min.js');

  // Javascript Load Image
  // https://github.com/blueimp/JavaScript-Load-Image
  app.import('vendor/load-image.all.min.js');
  app.import('vendor/js-canvas-to-blob.js');

  // Moment
  app.import('node_modules/moment/min/moment.min.js');
  app.import('node_modules/moment-timezone/builds/moment-timezone-with-data-2012-2022.min.js');

  // Sweet Alert
  app.import('vendor/sweetalert-dev.js');
  app.import('vendor/sweetalert.css');

  // Mapbox standalone
  app.import('vendor/mapbox.standalone.js');
  app.import('vendor/mapbox.standalone.css');

  // Raven
  app.import('node_modules/raven-js/dist/raven.js');

  return new MergeTrees([app.toTree(), cssFiles, fontFiles]);
};
