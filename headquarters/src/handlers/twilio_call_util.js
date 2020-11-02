const twilio = require('twilio');

class TwilioCallUtil {
  /**
   * Generate a hangup response.
   */
  static hangup() {
    const response = new twilio.twiml.VoiceResponse();
    response.hangup();
    return response;
  }

  static say(phrase) {
    const response = new twilio.twiml.VoiceResponse();
    response.say(phrase);
    return response;
  }
}

module.exports = TwilioCallUtil;
