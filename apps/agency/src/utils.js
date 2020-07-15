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
  const userId = player.user ? player.user.id : 0;
  return `/travel/u/${userId}/p/${trip.id}/p/${player.id}?nogps=true&mute=true&noack=true`;
}
