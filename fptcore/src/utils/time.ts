const moment = require('moment-timezone');

const timeShorthandRegex = /^(\+\dd\s)?(\d|1[0-2]):[0-5]\d(a|p|am|pm)$/i;
const timeOffsetRegex = /^-?\d+(\.\d+)?[hms]$/;
const isoTimeRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d*Z/;

class TimeUtil {
  static timeShorthandRegex = timeShorthandRegex;
  static timeOffsetRegex = timeOffsetRegex;
  static isoTimeRegex = isoTimeRegex;

  /**
   * Get today in date form.
   */
  static getTodayDate(timezone: string): string {
    return moment.utc().tz(timezone).format('YYYY-MM-DD');
  }

  /**
   * Interpret time shorthand (8:00am), based on a base date and a timezone,
   * into UTC time.
   *
   * Interpret +Nd H:mma by adding a N*24 hours to the date.
   */
  static convertTimeShorthandToIso(shorthand: string, date: string, timezone: string): string {
    let addDays = 0;
    if (shorthand[0] === '+' && shorthand.indexOf(' ') > -1) {
      addDays = Number(shorthand.split(' ')[0][1]);
      shorthand = shorthand.split(' ')[1];
    }
    const localTimeString = date + ' ' + shorthand;
    const localFormat = 'YYYY-MM-DD h:mma';
    const localTime = moment
      .tz(localTimeString, localFormat, timezone)
      .add(addDays, 'days');
    return localTime.utc().toISOString();
  }

  /**
   * Convert an ISO timestamp to a human readable time. Time only if today,
   * otherwise include the day.
   */
  static humanizeIso(iso: string, timezone: string): string {
    const time = moment.utc(iso).tz(timezone);
    const now = moment.utc().tz(timezone);
    const format = time.isSame(now, 'day') ? 'h:mma' : 'ddd, h:mma';
    return time.format(format);
  }

  static validateTimeShorthand(timeShorthand: string): boolean {
    return timeShorthandRegex.test(timeShorthand);
  }

  /**
   * Humanize a time duration in seconds.
   */
  static humanizeDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds - (mins * 60));
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  /**
   * Convert a duration shorthand like 3s or 10m into seconds.
   */
  static secondsForDurationShorthand(durShorthand: string): number {
    if (!durShorthand) {
      return 0;
    }
    const num = Number(durShorthand.substr(0, durShorthand.length - 1));
    const unit = durShorthand.substr(durShorthand.length - 1);
    if (!num || !unit || num < 0) {
      return 0;
    }
    const multiplier: Record<string, number> = { s: 1, m: 60, h: 3600 };
    if (!multiplier[unit]) {
      return 0;
    }
    return num * multiplier[unit];
  }

  /**
   * Allow positive or negative values for offsets.
   */
  static secondsForOffsetShorthand(offsetShorthand: string): number {
    if (!offsetShorthand) {
      return 0;
    }
    if (offsetShorthand[0] === '-') {
      return -TimeUtil.secondsForDurationShorthand(offsetShorthand.substr(1));
    }
    return TimeUtil.secondsForDurationShorthand(offsetShorthand);
  }
}

export default TimeUtil;
