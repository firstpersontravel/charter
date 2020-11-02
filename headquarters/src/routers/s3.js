const s3Router = require('react-s3-uploader/s3router');

const config = require('../config');

// S3 signing url
const s3Opts = {
  bucket: config.env.HQ_CONTENT_BUCKET,
  ACL: 'public-read',
  uniquePrefix: false,
  signatureExpires: 600 // signature is valid for 10 minutes
};
if (config.env.HQ_STAGE === 'staging') {
  // special case: staging bucket is in us-east-1 -- other buckets are us-west-2
  // like our ECS cluster.
  s3Opts.region = 'us-east-1';
}

module.exports = s3Router(s3Opts);