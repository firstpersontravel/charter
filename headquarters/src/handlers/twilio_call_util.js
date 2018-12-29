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

  /**
   * Return a voicemail, or hangup if no voicemail is available.
   */
  static hangupOrVoicemail(experienceName, voicemailPath) {
    // If no voicemail configured, hang up.
    if (!voicemailPath) {
      return this.hangup();
    }
    // Otherwise, play voicemail
    const twimlResponse = new twilio.twiml.VoiceResponse();
    const voicemailUrl = this.getTwilioMediaPath(experienceName,
      voicemailPath);
    twimlResponse.play({}, voicemailUrl);
    twimlResponse.hangup();
    return twimlResponse;
  }
}

module.exports = TwilioCallUtil;
