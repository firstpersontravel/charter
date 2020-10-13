/* jshint node: true */

module.exports = function(environment) {
  var ENV = {
    modulePrefix: 'traveller',
    environment: environment,
    baseURL: '/travel/',
    sentryDSN: 'https://7e43c1af484e4baa92bb0083119ca264@sentry.io/103093',
    locationType: 'auto',
    s3UploadParams: {
      policy: {
        expiration: '2030-01-01T00:00:00.000Z',
        conditions: [
          {bucket: 'fpt-traveler-uploads'},
          {acl: 'private'},
          {success_action_status: '201'},
          ['starts-with', '$key', ''],
          ['starts-with', '$Content-Type', 'image/'],
          ['eq', '$Cache-Control', 'max-age=31536000'],
          ['content-length-range', 0, 20971520]
        ]
      },
      signature: 'koLIpdoU9n77p0SD2yZs5OCY6QQ=',
      awsAccessKeyId: 'AKIA4XUHCH2W5ZKEJBVN',
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
    ENV.APP.LOG_BINDINGS = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  return ENV;
};
