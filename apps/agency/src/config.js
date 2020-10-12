export default {
  analyticsEnabled: !!window.config.FRONTEND_ANALYTICS_ENABLED,
  contentBucket: window.config.FRONTEND_CONTENT_BUCKET,
  gitHash: window.config.GIT_HASH,
  googleApiKey: window.config.FRONTEND_GOOGLE_API_KEY,
  serverUrl: window.config.FRONTEND_SERVER_URL
};
