export default {
  authToken: window.config.TRAVEL2_AUTH_TOKEN,
  analyticsEnabled: !!window.config.TRAVEL2_ANALYTICS_ENABLED,
  clientId: Math.floor(Math.random() * 10000000).toString(),
  contentBucket: window.config.TRAVEL2_CONTENT_BUCKET,
  gitHash: window.config.GIT_HASH,
  googleApiKey: window.config.TRAVEL2_GOOGLE_API_KEY,
  serverUrl: window.config.TRAVEL2_SERVER_URL,
  stage: window.config.TRAVEL2_STAGE
};
