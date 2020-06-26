export default {
  contentBucket: window.config.FRONTEND_CONTENT_BUCKET,
  serverUrl: window.config.FRONTEND_SERVER_URL,
  pubsubUrl: window.config.FRONTEND_PUBSUB_URL,
  analyticsEnabled: !!window.config.FRONTEND_ANALYTICS_ENABLED
};
