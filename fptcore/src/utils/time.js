var moment = require('moment-timezone');

var TimeUtil = {};

TimeUtil.timeShorthandRegex = /^(\+\dd\s)?(\d|1[0-2]):[0-5]\d(a|p|am|pm)$/i;
TimeUtil.timeOffsetRegex = /^-?\d+(\.\d+)?[hms]$/;
TimeUtil.isoTimeRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d*Z/;

/**
 * Get today in date form.
 */
TimeUtil.getTodayDate = function(timezone) {
  return moment.utc().tz(timezone).format('YYYY-MM-DD');
};

/**
 * Interpret time shorthand (8:00am), based on a base date and a timezone,
 * into UTC time.
 *
 * Interpret +Nd H:mma by adding a N*24 hours to the date.
 */
TimeUtil.convertTimeShorthandToIso = function (shorthand, date, timezone) {
  var addDays = 0;
  if (shorthand[0] === '+' && shorthand.indexOf(' ') > -1) {
    addDays = Number(shorthand.split(' ')[0][1]);
    shorthand = shorthand.split(' ')[1];
  }
  var localTimeString = date + ' ' + shorthand;
  var localFormat = 'YYYY-MM-DD h:mma';
  var localTime = moment
    .tz(localTimeString, localFormat, timezone)
    .add(addDays, 'days');
  return localTime.utc().toISOString();
};

/**
 * Convert an ISO timestamp to a human readable time. Time only if today,
 * otherwise include the day.
 */
TimeUtil.humanizeIso = function (iso, timezone) {
  var time = moment.utc(iso).tz(timezone);
  var now = moment.utc().tz(timezone);
  var format = time.isSame(now, 'day') ? 'h:mma' : 'ddd, h:mma';
  return time.format(format);
};

TimeUtil.validateTimeShorthand = function (timeShorthand) {
  return TimeUtil.timeShorthandRegex.test(timeShorthand);
};

/**
 * Humanize a time duration in seconds.
 */
TimeUtil.humanizeDuration = function (seconds) {
  var mins = Math.floor(seconds / 60);
  var secs = Math.floor(seconds - (mins * 60));
  return mins + ':' + (secs < 10 ? '0' : '') + secs;
};

/**
 * Convert a duration shorthand like 3s or 10m into seconds.
 */
TimeUtil.secondsForDurationShorthand = function(durationShorthand) {
  if (!durationShorthand) {
    return 0;
  }
  var num = Number(durationShorthand.substr(0, durationShorthand.length - 1));
  var unit = durationShorthand.substr(durationShorthand.length - 1);
  if (!num || !unit || num < 0) {
    return 0;
  }
  var multiplier = { s: 1, m: 60, h: 3600 }[unit];
  if (!multiplier) {
    return 0;
  }
  return num * multiplier;
};

/**
 * Allow positive or negative values for offsets.
 */
TimeUtil.secondsForOffsetShorthand = function(offsetShorthand) {
  if (!offsetShorthand) {
    return 0;
  }
  if (offsetShorthand[0] === '-') {
    return -TimeUtil.secondsForDurationShorthand(offsetShorthand.substr(1));
  }
  return TimeUtil.secondsForDurationShorthand(offsetShorthand);
};

module.exports = TimeUtil;
