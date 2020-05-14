const _ = require('lodash');

export function getStage() {
  if (window.location.host.indexOf('staging.firstperson.travel') > -1 ||
      window.location.host.indexOf('beta.firstperson.travel') > -1) {
    return 'staging';
  }
  if (window.location.host.indexOf('app.firstperson.travel') > -1 ||
      window.location.host.indexOf('charter.firstperson.travel') > -1) {
    return 'production';
  }
  return 'development';
}

export function isProduction() {
  return getStage() === 'production';
}

export function getUserIframeUrl(group, user) {
  return `/actor/${group.org.name}/user/${user.id}?nogps=1&noack=1`;
}

export function getPlayerIframeUrl(trip, player) {
  const user = player.user;
  const role = _.find(trip.script.content.roles, { name: player.roleName });
  if (role.type === 'performer' || !user) {
    return `/actor/${trip.org.name}/player/${player.id}?nogps=1&noack=1`;
  }
  return `/travel/u/${user.id}/p/${trip.id}/role/${player.roleName}?nogps=true&mute=true&noack=true`;
}
