
export default {

  isoTimeRegex: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d*Z/,
  absTimeRegex: /(\d+):(\d+)(am|pm)/i,
  relTimeRegex: /\+?\d+[ms]/,

  isTimeString: function(timeString) {
    if (this.isoTimeRegex.text(timeString)) {
      return true;
    }
    if (this.absTimeRegex.test(timeString)) {
      return true;
    }
    if (this.relTimeRegex.test(timeString)) {
      return true;
    }
    return false;
  },

  parseTimeString: function(timeString, utcNow) {
    // First test absolute times
    if (this.absTimeRegex.test(timeString) ||
        this.isoTimeRegex.text(timeString)) {
      return this.parseAbsoluteTimeString(timeString, utcNow);
    }
    // Then relative times
    if (this.relTimeRegex.test(timeString)) {
      return this.parseRelativeTimeString(timeString, utcNow);
    }
    throw new Error('invalid at time string ' + timeString);
  },

  parseAbsoluteTimeString: function(absoluteTimeString, utcNow) {
    if (this.isoTimeRegex.test(absoluteTimeString)) {
      return moment.utc(absoluteTimeString);
    }
    var groups = this.absTimeRegex.exec(absoluteTimeString);
    var hour = parseInt(groups[1], 10);
    var minute = parseInt(groups[2], 10);
    var isPm = groups[3].toLowerCase() === 'pm';
    if (isPm) {
      hour = hour < 12 ? hour + 12 : 12;
    } else {
      hour = hour < 12 ? hour : 0;
    }
    var localNow = utcNow.local();
    var localTime = localNow.clone();
    localTime.hour(hour);
    localTime.minute(minute);
    localTime.second(0);
    localTime.millisecond(0);
    if (localTime < localNow.clone().subtract(6, 'hours')) {
      localTime.add(1, 'days');
    }
    return localTime.utc();
  },

  parseRelativeTimeString: function(relativeTimeString, utcNow) {
    var utcTime = utcNow.clone();
    var amount = relativeTimeString;
    if (amount[0] === '+') {
      amount = amount.slice(1, amount.length - 1);
    }
    var unitAbbr = relativeTimeString.slice(relativeTimeString.length - 1);
    var unit = {m: 'minutes', s: 'seconds'}[unitAbbr];
    if (!unit) {
      throw new Error("invalid relative time string " + relativeTimeString);
    }
    utcTime = utcTime.add(parseInt(amount, 10), unit);
    return utcTime;
  }
};
