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

export function getParticipantIframeUrl(group, participant) {
  const url = `${window.location.origin}/actor/${group.org.name}/participant/${participant.id}`;
  return `${url}?nogps=1&noack=1`;
}

export function getPlayerIframeUrl(trip, player) {
  const participantId = player.participant ? player.participant.id : 0;
  const url = `${window.location.origin}/travel/u/${participantId}/r/${trip.id}/p/${player.id}`;
  return `${url}?nogps=true&mute=true&noack=true`;
}
