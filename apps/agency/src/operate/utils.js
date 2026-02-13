import _ from 'lodash';

const FptCore = require('fptcore').default;

import config from '../config';

export function fullMediaUrl(org, experience, url) {
  if (_.startsWith(url, 'http')) {
    return url;
  }
  const host = `https://${config.contentBucket}.s3.amazonaws.com`;
  return `${host}/${org.name}/${experience.name}/${url}`;
}

export function getPlayerPageInfo(trip, player) {
  return FptCore.PlayerCore.getPageInfo(trip.script, trip.evalContext, trip, player);
}

export default {
  getPlayerPageInfo: getPlayerPageInfo,
  fullMediaUrl: fullMediaUrl
};
