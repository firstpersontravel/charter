export default {
  s3ContentBucket: process.env.S3_CONTENT_BUCKET,
  serverUrl: process.env.SERVER_URL,
  pubsubUrl: process.env.PUBSUB_URL,
  analyticsEnabled: process.env.ANALYTICS_ENABLED === 'true'
};
