/* jshint node: true */

module.exports = function(environment) {

  var SENTRY_DSNS = {
    production: 'https://004c6a38a9c34102a2b53daaa418bd6c@sentry.io/103092'
  };

  var ENV = {
    modulePrefix: 'traveller',
    environment: environment,
    baseURL: '/travel/',
    sentryDSN: SENTRY_DSNS[environment],
    locationType: 'auto',
    s3UploadParams: {
      policy: {
        expiration: '2020-08-13T03:52:42.000Z',
        conditions: [
          {bucket: 'fpt-traveler-uploads'},
          {acl: 'private'},
          {success_action_status: '201'},
          ['starts-with', '$key', ''],
          ['starts-with', '$Content-Type', 'image/'],
          ['eq', '$Cache-Control', 'max-age=31536000'],
          ['content-length-range', 0, 20 * 1024 * 1024]
        ]
      },
      signature: 'pe/XpifezoQIPQza9wzH3wlHbnw=',
      awsAccessKeyId: 'AKIAJZTEBLUXLG4I3NDQ',
      bucket: 'fpt-traveler-uploads',
    },
    moment: {
      includeTimezone: '2012-2022'
    },
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
        'ds-references': true
      }
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    }
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_BINDINGS = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  return ENV;
};
