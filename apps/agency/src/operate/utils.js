import _ from 'lodash';

import { PlayerCore } from 'fptcore';

import config from '../config';

export function fullMediaUrl(org, experience, url) {
  if (_.startsWith(url, 'http')) {
    return url;
  }
  const host = `https://${config.contentBucket}.s3.amazonaws.com`;
  return `${host}/${org.name}/${experience.name}/${url}`;
}

export function getPlayerPageInfo(trip, player) {
  return PlayerCore.getPageInfo(trip.script, trip.evalContext, trip, player);
}

export default {
  getPlayerPageInfo: getPlayerPageInfo,
  fullMediaUrl: fullMediaUrl
};
