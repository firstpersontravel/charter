const twilio = require('twilio');

const config = require('../config');

class TwilioCallUtil {
  /**
   * Generate a path for referred media.
   */
  static getTwilioMediaPath(experienceName, mediaPath) {
    const mediaHost = config.env.TWILIO_MEDIA_HOST;
    return `${mediaHost}/${experienceName}/${mediaPath}`;
  }

  /**
   * Generate a hangup response.
   */
  static hangup() {
    const response = new twilio.twiml.VoiceResponse();
    response.hangup();
    return response;
  }
}

module.exports = TwilioCallUtil;
